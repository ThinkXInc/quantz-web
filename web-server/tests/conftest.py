# web-server/tests/conftest.py
#
# Q-1: quantz-web をテストプロセスで import 可能にする配線。
# main.py は import 時に (1) config 検査、(2) MongoDB 接続、(3) RedisSessionInterface 生成を
# 行うため、そのままでは import できない。以下を main import より前に仕込む:
#   1) config 注入: sys.modules['config'] = config_test(全必須キーを埋めたテスト用 Config)。
#      本番 config.py は編集しない(src 変更ゼロ。計画 Q-1 の「config 選択」)。
#   2) redis を fakeredis に差し替え(init_flask_app の RedisSessionInterface() と
#      submodule libcommon の Session クラス属性 pool 生成が実 redis に繋がないように)。
#   3) mongoengine.connect を mongomock に差し替え(init_mongodb の module-level connect)。

import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))       # web-server/tests
_WEBSERVER = os.path.dirname(_HERE)                       # web-server

for _p in (_HERE, _WEBSERVER):
    if _p not in sys.path:
        sys.path.insert(0, _p)

# 本番は web-server/ を cwd に起動する(jinja loader が 'views/templates' の相対パス)。
# テストをどこから起動しても本番同等にテンプレ解決できるよう cwd を web-server に固定する。
os.chdir(_WEBSERVER)

# 1) config 注入(最初に。以降の `from config import ...` は全てこれを掴む)
import config_test
sys.modules['config'] = config_test

# 2) redis -> fakeredis
import redis
import fakeredis

_FAKE_SERVER = fakeredis.FakeServer()


class _FakeConnectionPool:
    def __init__(self, *args, **kwargs):
        self.kwargs = kwargs


def _fake_client(*args, **kwargs):
    return fakeredis.FakeStrictRedis(server=_FAKE_SERVER)


redis.ConnectionPool = _FakeConnectionPool
redis.StrictRedis = _fake_client
redis.Redis = _fake_client

# 3) mongoengine.connect -> mongomock
import mongoengine
import mongomock

_orig_connect = mongoengine.connect


def _mock_connect(*args, **kwargs):
    kwargs.setdefault('mongo_client_class', mongomock.MongoClient)
    return _orig_connect(*args, **kwargs)


mongoengine.connect = _mock_connect

# 4) boto3 を no-op mock に(mails/send_mail.py が import 時に SES テスト送信を行い、
#    実ネットワーク I/O + boto3 リトライで import がハングするため。全 AWS 呼出を遮断)。
import boto3
from unittest.mock import MagicMock

boto3.client = lambda *args, **kwargs: MagicMock()
boto3.resource = lambda *args, **kwargs: MagicMock()

# 5) vectordb_server は web-server の path 外の別コンポーネント(celery worker 側)。
#    web の import-ability には task ハンドル / モデル名の解決だけ必要なので、
#    vectordb_server.* の全 import を mock module に解決する meta path finder を仕込む。
import importlib.abc
import importlib.machinery


class _MockVectordbFinder(importlib.abc.MetaPathFinder, importlib.abc.Loader):
    def find_spec(self, name, path, target=None):
        if name == 'vectordb_server' or name.startswith('vectordb_server.'):
            spec = importlib.machinery.ModuleSpec(name, self)
            spec.submodule_search_locations = []  # package 扱い(submodule も finder が解決)
            return spec
        return None

    def create_module(self, spec):
        m = MagicMock()
        m.__path__ = []  # package マーク
        m.__spec__ = spec
        return m

    def exec_module(self, module):
        pass


sys.meta_path.insert(0, _MockVectordbFinder())

import pytest


@pytest.fixture
def fake_redis_server():
    return _FAKE_SERVER
