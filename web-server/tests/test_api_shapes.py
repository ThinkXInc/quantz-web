# web-server/tests/test_api_shapes.py
#
# Q-2 (b): 代表 API 3型のレスポンス JSON 形状を凍結する(コーディングガイドの3型)。
#   1. 成功            -> SuccessFormat 系 {code, message, (+data 展開)}
#   2. 単体エラー      -> APIErrorFormat 系 {field_name, code, message, reason}
#   3. バリデーション   -> ValidationErrorsFormat 系 {code, reason, message, errors:[...]}
# 値は非決定なので top-level キー集合 + status を「形状」として凍結する。
#
# 型2・型3 は live エンドポイント(/v1/<lang>/users/create)から取得する。
# 型1(成功)は認証済み live 応答が harness 下で得られない(認証は User 作成を要し、
# mongomock が create_new の一部クエリを "Special options not supported" で拒否する。
# findings E-15)。したがって成功型は、エンドポイントが返すのと同一の SuccessFormat 系
# クラスを app 文脈で直接 http_response() して契約形状を凍結する。

import pytest

from golden_utils import assert_golden

from libcommon.web.http_successes import OKAPISuccessFormat


@pytest.fixture(scope='module')
def flask_app():
    from main import app
    app.testing = False
    return app


def _shape(resp):
    body = resp.get_json(silent=True)
    keys = sorted(body.keys()) if isinstance(body, dict) else None
    return {'status': resp.status_code, 'keys': keys}


def test_validation_errors_shape(flask_app):
    # email 有・password 欠落 -> バリデーション errors 配列(400)
    resp = flask_app.test_client().post('/v1/en/users/create', json={'email': 'notanemail'})
    shape = _shape(resp)
    assert shape['status'] == 400
    assert shape['keys'] == ['code', 'errors', 'message', 'reason']
    assert_golden('api_shape_validation_errors', shape)


def test_validation_errors_empty_json_shape(flask_app):
    # N-14 (P3-Q1): email キー無し(空 JSON)でも検証前アクセスで 500 にならず、
    # 400 バリデーション形状(型3)を返す(旧挙動: L329 の request.json["email"] が KeyError -> 500)。
    resp = flask_app.test_client().post('/v1/en/users/create', json={})
    shape = _shape(resp)
    assert shape['status'] == 400
    assert shape['keys'] == ['code', 'errors', 'message', 'reason']
    assert_golden('api_shape_validation_errors_empty_json', shape)


def test_single_error_shape(flask_app):
    # 非 JSON Content-Type -> 単体 APIError(415)
    resp = flask_app.test_client().post('/v1/en/users/create', data='x', content_type='text/plain')
    shape = _shape(resp)
    assert shape['status'] == 415
    assert set(('field_name', 'code', 'message', 'reason')).issubset(shape['keys'])
    assert_golden('api_shape_single_error', shape)


def test_signup_page_data_single_injection(flask_app):
    # Q-5c: GET /signup は 200 のまま、かつ PAGE_DATA 単一注入がテンプレに存在する。
    resp = flask_app.test_client().get('/v1/en/signup')
    assert resp.status_code == 200
    body = resp.get_data(as_text=True)
    assert 'PAGE_DATA' in body


def test_success_shape(flask_app):
    # 成功系の契約形状(エンドポイントが返すのと同一クラス)。
    with flask_app.test_request_context():
        resp, status = OKAPISuccessFormat(
            message='user_found', data={'user': {'id': 'x', 'email': 'x@example.com'}}
        ).http_response()
        body = resp.get_json()
    shape = {'status': status, 'keys': sorted(body.keys())}
    assert 'code' in shape['keys'] and 'message' in shape['keys']
    assert_golden('api_shape_success', shape)
