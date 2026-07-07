# route_helpers.py
#
# Q-5b: `/v1/xxx` と `/v1/<lang>/xxx` の二重 route 登録を一発で行うヘルパ。
# 従来の
#     @blueprint.route('/v1/xxx', ...)
#     @blueprint.route('/v1/<lang>/xxx', ...)
# の2連デコレータを1つに集約する型を実証する(展開は次期。ここでは accounts の signup/signin
# の2箇所のみ置換)。


def route_with_lang(blueprint, path, **options):
    """blueprint に ``/v1{path}`` と ``/v1/<lang>{path}`` の2ルートを登録するデコレータ。

    Args:
        blueprint: Flask Blueprint。
        path: ``/v1`` 以下のパス(例 ``'/signup'``)。
        **options: ``methods`` 等、Flask route のオプション。
    """
    def decorator(f):
        blueprint.route(f'/v1{path}', **options)(f)
        blueprint.route(f'/v1/<lang>{path}', **options)(f)
        return f
    return decorator
