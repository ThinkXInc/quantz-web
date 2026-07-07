# web-server/tests/test_app_imports.py
#
# Q-1 完了条件: conftest の注入(config_test / mongomock / fakeredis)の下で
# `from main import app` が成功することを凍結する。

def test_app_imports():
    from main import app
    assert app is not None
    # Flask アプリとして最低限の体裁(ルートが登録されている)
    rules = list(app.url_map.iter_rules())
    assert len(rules) > 0
