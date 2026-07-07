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


def test_send_mail_module_has_no_import_time_send():
    # N-13 (P3-Q2): mails.send_mail の import 時に mail.send(SES 送信)が呼ばれないこと
    # (旧挙動: モジュールレベルで SES テストメール2通を送信していた)。
    import importlib
    from unittest import mock
    import mails.send_mail as sm
    with mock.patch.object(sm.Mail, 'send') as send_spy:
        importlib.reload(sm)
    assert send_spy.call_count == 0
