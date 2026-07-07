# app_session.py
#
# Q-4(L-1 追随): 依存注入版 session_helper を生成する中央定義。
# libcommon は make_session_helper(user_loader, on_no_session, on_user_not_found) を公開し、
# アプリ側が自分の User 取得関数と例外を注入する(レイヤ逆転の解消)。
# 各 blueprint はここから session_helper を import して従来どおり @session_helper で使う。

from libcommon.web.flask_helpers import make_session_helper
from models.data.user import User, UnauthorizedAccessError, UserNotFoundError

session_helper = make_session_helper(
    user_loader=lambda uid: User.objects(id=uid).first(),
    on_no_session=UnauthorizedAccessError,
    on_user_not_found=UserNotFoundError,
)
