(function(ns) {    
    ns.ButtonTextLocales = {
        en: {
            standby: "Resolve your question now",
            connected: "Connected",
            pushSpeak: "Speak while pushing",
            listening: "Listening...",
            loading: 'Loading..',
            replying: "Replying...",
            busy: "Failed to connect. Try again later.",
            limitReached: "Usage limit reached."
        },
        ja: {
            standby: "今すぐ疑問を解決",
            connected: "接続済み",
            pushSpeak: "押しながら話してください",
            listening: "聞いています...",
            loading: 'ロード中...',
            replying: "返信中...",
            busy: "接続に失敗しました。時間を置いて再度お試しください。",
            limitReached: "利用回数の上限に達しました。"
        },
        zh: {
            standby: "立即解决您的问题",
            connected: "已连接",
            pushSpeak: "按住说话",
            listening: "正在听...",
            loading: '加载中...',
            replying: "回复中...",
            busy: "连接失败，请稍后再试。",
            limitReached: "已达到使用限制。"
        },
        es: {
            standby: "Resuelve tu pregunta ahora",
            connected: "Conectado",
            pushSpeak: "Habla mientras pulsas",
            listening: "Escuchando...",
            loading: 'Cargando...',
            replying: "Respondiendo...",
            busy: "Falló la conexión. Intenta de nuevo más tarde.",
            limitReached: "Se alcanzó el límite de uso."
        },
        fr: {
            standby: "Résolvez votre question maintenant",
            connected: "Connecté",
            pushSpeak: "Parlez en appuyant",
            listening: "Écoute...",
            loading: 'Chargement...',
            replying: "En réponse...",
            busy: "Échec de la connexion. Réessayez plus tard.",
            limitReached: "Limite d'utilisation atteinte."
        },
        ar: {
            standby: "حل سؤالك الآن",
            connected: "متصل",
            pushSpeak: "تحدث أثناء الضغط",
            listening: "استماع...",
            loading: 'جاري التحميل...',
            replying: "جاري الرد...",
            busy: "فشل الاتصال. حاول مرة أخرى لاحقًا.",
            limitReached: "تم الوصول للحد الأقصى للإستخدام."
        },
        ru: {
            standby: "Решите ваш вопрос сейчас",
            connected: "Подключено",
            pushSpeak: "Говорите, удерживая кнопку",
            listening: "Слушаю...",
            loading: 'Загрузка...',
            replying: "Отвечаю...",
            busy: "Не удалось подключиться. Попробуйте позже.",
            limitReached: "Достигнут предельный лимит."
        }
    };

    ns.SpeakerLocales = {
        en: {
            user: "User",
            system: "Operator",
            announce: "*",
        },
        ja: {
            user: "ユーザー",
            system: "オペレーター",
            announce: "*",
        },
        zh: {
            user: "用户",
            system: "操作员",
            announce: "*",
        },
        es: {
            user: "Usuario",
            system: "Operador",
            announce: "*",
        },
        fr: {
            user: "Utilisateur",
            system: "Opérateur",
            announce: "*",
        },
        ar: {
            user: "المستخدم",
            system: "المشغل",
            announce: "*",
        },
        ru: {
            user: "Пользователь",
            system: "Оператор",
            announce: "*",
        }
    };

    ns.BalloonLocales = {
        en: {
            annotation: 'This system can make mistakes and may not be suitable for important issues.'
        },
        ja: {
            annotation: '誤った回答をすることもあります。重要な問題は直接ご連絡ください。'
        },
        zh: {
            annotation: '本系统可能会出错，不适用于重要事务。'
        },
        es: {
            annotation: 'Este sistema puede cometer errores y no puede ser adecuado para asuntos importantes.'
        },
        fr: {
            annotation: 'Ce système peut faire des erreurs et peut ne pas convenir pour des questions importantes.'
        },
        ar: {
            annotation: 'قد يخطئ هذا النظام وقد لا يكون مناسبًا للمسائل المهمة.'
        },
        ru: {
            annotation: 'Эта система может совершать ошибки и может быть не подходит для важных вопросов.'
        }
    };
})(Quantz); 