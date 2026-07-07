# web-server/tests/test_route_sweep.py
#
# Q-2 (a): 全 GET ルートを Flask test client で総なめし、(ルール, ステータス) を凍結する。
# 200/302/401/404/500 いずれも「現状」として記録する(本文は非決定なので status のみ)。
# ★ このスイートは以後の全変更の受け入れ試験を兼ね、AWS 移行 STEP2 の受け入れ試験でもある。★

import re

import pytest

from golden_utils import assert_golden


def _concrete(rule):
    """ルール文字列を具体 URL に(<lang>→en、その他プレースホルダ→x)。"""
    def repl(m):
        seg = m.group(0)
        return 'en' if 'lang' in seg else 'x'
    return re.sub(r'<[^>]+>', repl, rule)


@pytest.fixture(scope='module')
def app():
    from main import app as flask_app
    flask_app.testing = False  # 現状のエラーハンドラ経由の応答を観測(500 を伝播させない)
    return flask_app


def test_get_route_sweep(app):
    client = app.test_client()
    table = {}
    seen = set()
    for rule in sorted(app.url_map.iter_rules(), key=lambda r: r.rule):
        if 'GET' not in rule.methods:
            continue
        if rule.rule in seen:
            continue
        seen.add(rule.rule)
        url = _concrete(rule.rule)
        resp = client.get(url)
        table[rule.rule] = resp.status_code
    assert_golden('route_sweep', table)
