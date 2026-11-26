window.AHOJ_SPEAKING_PILOT = {
  "version": 1,
  "source": "Recovered direction audit: L01–L03 revised pilot candidates, L04–L18 preserved drafts; not canonical syllabus.",
  "lessons": [
    {
      "id": "A0-T02-L01",
      "title": "Мэндлэх, үдэх",
      "goal": "Тохирох мэндчилгээ, үдэлтийг хэлэх",
      "steps": [
        {
          "type": "learn",
          "cz": "Dobrý den.",
          "mn": "Сайн байна уу.",
          "hint": "Албан ёсны мэндчилгээ"
        },
        {
          "type": "learn",
          "cz": "Ahoj!",
          "mn": "Сайн уу. / Баяртай.",
          "hint": "Дотно харилцаа"
        },
        {
          "type": "learn",
          "cz": "Na shledanou.",
          "mn": "Баяртай.",
          "hint": "Албан ёсны үдэлт"
        },
        {
          "type": "match",
          "pairs": [
            [
              "Dobrý den.",
              "Сайн байна уу."
            ],
            [
              "Ahoj!",
              "Сайн уу. / Баяртай. (дотно)"
            ],
            [
              "Na shledanou.",
              "Баяртай. (албан)"
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "Na shledanou.",
              "options": [
                "Dobrý den.",
                "Na shledanou.",
                "Ahoj!"
              ]
            },
            {
              "cz": "Dobrý den.",
              "options": [
                "Ahoj!",
                "Dobrý den.",
                "Na shledanou."
              ]
            }
          ]
        },
        {
          "type": "context",
          "prompt": "Өдрийн цагаар танихгүй хүнтэй албан ёсоор мэндэл.",
          "options": [
            "Ahoj!",
            "Na shledanou.",
            "Dobrý den."
          ],
          "answer": "Dobrý den."
        },
        {
          "type": "gap",
          "prompt": "Na ___.",
          "options": [
            "den",
            "shledanou",
            "ahoj"
          ],
          "answer": "shledanou",
          "cz": "Na shledanou."
        },
        {
          "type": "listen_meaning",
          "items": [
            {
              "cz": "Dobrý den.",
              "answer": "Танихгүй хүнтэй өдрийн цагаар мэндэлж байна.",
              "options": [
                "Эелдгээр үдэж байна.",
                "Танихгүй хүнтэй өдрийн цагаар мэндэлж байна.",
                "Өөрийн нэрийг хэлж байна."
              ]
            },
            {
              "cz": "Na shledanou.",
              "answer": "Албан ёсоор үдэж байна.",
              "options": [
                "Албан ёсоор үдэж байна.",
                "Өөрийгөө танилцуулж байна.",
                "Албан ёсоор мэндэлж байна."
              ]
            }
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Dobrý den.",
              "mn": "Үйлчилгээний ажилтантай мэндэл.",
              "models": [
                "Dobrý den."
              ],
              "listenFirst": true
            },
            {
              "partner": "Na shledanou.",
              "mn": "Эелдгээр үд.",
              "models": [
                "Na shledanou."
              ],
              "listenFirst": true
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Найзтайгаа мэндэл.",
              "models": [
                "Ahoj!"
              ]
            },
            {
              "mn": "Танихгүй хүнтэй өдрийн цагаар мэндэл.",
              "models": [
                "Dobrý den."
              ]
            },
            {
              "mn": "Албан ёсоор үд.",
              "models": [
                "Na shledanou."
              ]
            }
          ]
        }
      ],
      "revision": 2,
      "review_status": "pilot_candidate"
    },
    {
      "id": "A0-T02-L02",
      "title": "Өөрийгөө танилцуулах",
      "goal": "Мэндлээд нэрээ хэлэх",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Өдрийн цагаар танихгүй хүнтэй мэндэл.",
              "models": [
                "Dobrý den."
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "Jmenuji se",
          "mn": "Намайг … гэдэг.",
          "hint": "Жишээ: Jmenuji se Anna.",
          "example": "Jmenuji se Anna."
        },
        {
          "type": "learn",
          "cz": "Jsem",
          "mn": "Би … байна.",
          "hint": "Жишээ: Jsem Petr.",
          "example": "Jsem Petr."
        },
        {
          "type": "learn",
          "cz": "Těší mě.",
          "mn": "Танилцсандаа таатай байна."
        },
        {
          "type": "match",
          "pairs": [
            [
              "Dobrý den.",
              "Сайн байна уу."
            ],
            [
              "Na shledanou.",
              "Баяртай. (албан)"
            ],
            [
              "Jmenuji se",
              "Намайг … гэдэг."
            ],
            [
              "Jsem",
              "Би … байна."
            ],
            [
              "Těší mě.",
              "Танилцсандаа таатай байна."
            ]
          ]
        },
        {
          "type": "gap",
          "prompt": "Jmenuji ___ Anna.",
          "options": [
            "den",
            "se",
            "mě"
          ],
          "answer": "se",
          "cz": "Jmenuji se Anna."
        },
        {
          "type": "build",
          "mn": "Сайн байна уу. Намайг Петр гэдэг.",
          "tokens": [
            "Petr.",
            "se",
            "Dobrý",
            "Jmenuji",
            "den."
          ],
          "answer": [
            "Dobrý",
            "den.",
            "Jmenuji",
            "se",
            "Petr."
          ]
        },
        {
          "type": "listen_meaning",
          "items": [
            {
              "cz": "Jmenuji se Anna.",
              "answer": "Намайг Анна гэдэг.",
              "options": [
                "Танилцсандаа таатай байна.",
                "Намайг Анна гэдэг.",
                "Баяртай."
              ]
            },
            {
              "cz": "Těší mě.",
              "answer": "Танилцсандаа таатай байна.",
              "options": [
                "Сайн байна уу.",
                "Баяртай.",
                "Танилцсандаа таатай байна."
              ]
            }
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Dobrý den. Jmenuji se Anna.",
              "mn": "Мэндлээд өөрийгөө Петр гэж танилцуул.",
              "models": [
                "Dobrý den. Jmenuji se Petr.",
                "Dobrý den. Jsem Petr."
              ],
              "listenFirst": true
            },
            {
              "partner": "Těší mě.",
              "mn": "Танилцсандаа таатай байгаагаа хэл.",
              "models": [
                "Těší mě."
              ],
              "listenFirst": true
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Намайг Анна гэдэг.",
              "models": [
                "Jmenuji se Anna."
              ]
            },
            {
              "mn": "Танилцсандаа таатай байна.",
              "models": [
                "Těší mě."
              ]
            },
            {
              "mn": "Өөрийн нэрээ хэлж танилцуул.",
              "models": [
                "Jmenuji se Anna.",
                "Jsem Petr."
              ],
              "open": true
            }
          ]
        }
      ],
      "revision": 2,
      "review_status": "pilot_candidate"
    },
    {
      "id": "A0-T02-L03",
      "title": "Нэр асууж танилцах",
      "goal": "Нэр асууж, нэрээ хэлж, яриагаа дуусгах",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Намайг Петр гэдэг.",
              "models": [
                "Jmenuji se Petr."
              ]
            },
            {
              "mn": "Танилцсандаа таатай байна.",
              "models": [
                "Těší mě."
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "Jak se jmenujete?",
          "mn": "Таныг хэн гэдэг вэ?",
          "hint": "Хүндэтгэлийн хэлбэр"
        },
        {
          "type": "learn",
          "cz": "A vy?",
          "mn": "Харин та?"
        },
        {
          "type": "match",
          "pairs": [
            [
              "Na shledanou.",
              "Баяртай. (албан)"
            ],
            [
              "Jmenuji se",
              "Намайг … гэдэг."
            ],
            [
              "Těší mě.",
              "Танилцсандаа таатай байна."
            ],
            [
              "Jak se jmenujete?",
              "Таныг хэн гэдэг вэ?"
            ],
            [
              "A vy?",
              "Харин та?"
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "Jak se jmenujete?",
              "options": [
                "A vy?",
                "Jak se jmenujete?",
                "Těší mě."
              ]
            },
            {
              "cz": "A vy?",
              "options": [
                "Jak se jmenujete?",
                "Těší mě.",
                "A vy?"
              ]
            }
          ]
        },
        {
          "type": "gap",
          "prompt": "Jak se ___?",
          "options": [
            "jmenujete",
            "den",
            "mě"
          ],
          "answer": "jmenujete",
          "cz": "Jak se jmenujete?"
        },
        {
          "type": "build",
          "mn": "Таныг хэн гэдэг вэ?",
          "tokens": [
            "jmenujete?",
            "Jak",
            "se"
          ],
          "answer": [
            "Jak",
            "se",
            "jmenujete?"
          ]
        },
        {
          "type": "listen_meaning",
          "items": [
            {
              "cz": "Jak se jmenujete?",
              "answer": "Таныг хэн гэдэг вэ?",
              "options": [
                "Харин та?",
                "Таныг хэн гэдэг вэ?",
                "Намайг Анна гэдэг."
              ]
            },
            {
              "cz": "A vy?",
              "answer": "Харин та?",
              "options": [
                "Таныг хэн гэдэг вэ?",
                "Танилцсандаа таатай байна.",
                "Харин та?"
              ]
            }
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Dobrý den.",
              "mn": "Мэндлээд нэрийг нь асуу.",
              "models": [
                "Dobrý den. Jak se jmenujete?"
              ],
              "listenFirst": true
            },
            {
              "partner": "Jmenuji se Anna. A vy?",
              "mn": "Өөрийгөө танилцуул.",
              "models": [
                "Jmenuji se Petr.",
                "Jsem Petr."
              ],
              "open": true,
              "listenFirst": true
            },
            {
              "partner": "Těší mě.",
              "mn": "Хариулаад үдээрэй.",
              "models": [
                "Těší mě. Na shledanou."
              ],
              "listenFirst": true
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Таныг хэн гэдэг вэ?",
              "models": [
                "Jak se jmenujete?"
              ]
            },
            {
              "mn": "Харин та?",
              "models": [
                "A vy?"
              ]
            },
            {
              "mn": "Нэрээ хэлээд «Харин та?» гэж асуу.",
              "models": [
                "Jmenuji se Petr. A vy?",
                "Jsem Anna. A vy?"
              ],
              "open": true
            }
          ]
        }
      ],
      "revision": 2,
      "review_status": "pilot_candidate"
    },
    {
      "id": "A0-T02-L04",
      "title": "Сонин сайхан юу байна?",
      "goal": "Биеийн байдал асууж, товч хариулаад хариу асуулт тавих",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Албан ёсоор мэндэл.",
              "models": [
                "Dobrý den."
              ]
            },
            {
              "mn": "Харин та?",
              "models": [
                "A vy?"
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "Jak se máte?",
          "mn": "Та сайн уу? / Та ямар байна?",
          "hint": "Хүндэтгэлийн хэлбэр"
        },
        {
          "type": "learn",
          "cz": "Dobře, děkuji.",
          "mn": "Сайн, баярлалаа."
        },
        {
          "type": "learn",
          "cz": "Ujde to.",
          "mn": "Дажгүй ээ.",
          "hint": "Өдөр тутмын ярианы хэллэг"
        },
        {
          "type": "match",
          "pairs": [
            [
              "Jak se máte?",
              "Та ямар байна?"
            ],
            [
              "Dobře, děkuji.",
              "Сайн, баярлалаа."
            ],
            [
              "Ujde to.",
              "Дажгүй ээ."
            ],
            [
              "A vy?",
              "Харин та?"
            ],
            [
              "Těší mě.",
              "Танилцсандаа таатай байна."
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "Jak se máte?",
              "options": [
                "Jak se jmenujete?",
                "Jak se máte?",
                "A vy?"
              ]
            },
            {
              "cz": "Ujde to.",
              "options": [
                "Dobře, děkuji.",
                "Ujde to.",
                "Těší mě."
              ]
            }
          ]
        },
        {
          "type": "build",
          "mn": "Сайн, баярлалаа. Харин та?",
          "tokens": [
            "vy?",
            "děkuji.",
            "A",
            "Dobře,"
          ],
          "answer": [
            "Dobře,",
            "děkuji.",
            "A",
            "vy?"
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Dobrý den.",
              "mn": "Мэндлээд биеийн байдлыг нь асуу.",
              "models": [
                "Dobrý den. Jak se máte?"
              ]
            },
            {
              "partner": "Jak se máte?",
              "mn": "Сайн байгаагаа хэлээд хариу асуу.",
              "models": [
                "Dobře, děkuji. A vy?"
              ]
            },
            {
              "partner": "Ujde to.",
              "mn": "Албан ёсоор үд.",
              "models": [
                "Na shledanou."
              ]
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Та ямар байна?",
              "models": [
                "Jak se máte?"
              ]
            },
            {
              "mn": "Дажгүй ээ.",
              "models": [
                "Ujde to."
              ]
            },
            {
              "mn": "Сайн, баярлалаа. Харин та?",
              "models": [
                "Dobře, děkuji. A vy?"
              ]
            }
          ]
        }
      ],
      "review_status": "legacy_draft_unvalidated"
    },
    {
      "id": "A0-T02-L05",
      "title": "Тийм, үгүй гэж хариулах",
      "goal": "Нэрийг лавлах асуултад тийм, үгүй гэж хариулах",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Та ямар байна?",
              "models": [
                "Jak se máte?"
              ]
            },
            {
              "mn": "Сайн, баярлалаа.",
              "models": [
                "Dobře, děkuji."
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "Ano.",
          "mn": "Тийм."
        },
        {
          "type": "learn",
          "cz": "Ne.",
          "mn": "Үгүй."
        },
        {
          "type": "learn",
          "cz": "Jste Petr?",
          "mn": "Та Петр мөн үү?",
          "hint": "Jste + нэр? — хүндэтгэлтэй лавлах асуулт"
        },
        {
          "type": "match",
          "pairs": [
            [
              "Ano.",
              "Тийм."
            ],
            [
              "Ne.",
              "Үгүй."
            ],
            [
              "Jste Petr?",
              "Та Петр мөн үү?"
            ],
            [
              "Jsem Petr.",
              "Би Петр байна."
            ],
            [
              "Jak se jmenujete?",
              "Таныг хэн гэдэг вэ?"
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "Ano.",
              "options": [
                "Ne.",
                "Ano.",
                "Ujde to."
              ]
            },
            {
              "cz": "Jste Petr?",
              "options": [
                "Jak se máte?",
                "Jsem Petr.",
                "Jste Petr?"
              ]
            }
          ]
        },
        {
          "type": "build",
          "mn": "Тийм, би Петр байна.",
          "tokens": [
            "Petr.",
            "Ano,",
            "jsem"
          ],
          "answer": [
            "Ano,",
            "jsem",
            "Petr."
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Dobrý den. Jste Petr?",
              "mn": "Петрийн дүрд тогло. Мэндлээд тийм гэж хариул.",
              "models": [
                "Dobrý den. Ano, jsem Petr.",
                "Dobrý den. Ano."
              ]
            },
            {
              "partner": "Jste Petr?",
              "mn": "Аннагийн дүрд тогло. Үгүй гэж хэлээд нэрээ хэл.",
              "models": [
                "Ne, jsem Anna.",
                "Ne. Jmenuji se Anna."
              ]
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Та Петр мөн үү?",
              "models": [
                "Jste Petr?"
              ]
            },
            {
              "mn": "Тийм, би Петр байна.",
              "models": [
                "Ano, jsem Petr."
              ]
            },
            {
              "mn": "Үгүй, би Анна байна.",
              "models": [
                "Ne, jsem Anna."
              ]
            }
          ]
        }
      ],
      "review_status": "legacy_draft_unvalidated"
    },
    {
      "id": "A0-T02-L06",
      "title": "Өөр хүнийг танилцуулах",
      "goal": "Хэн болохыг асууж, өөр хүнийг нэрээр нь танилцуулах",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Тийм, би Петр байна.",
              "models": [
                "Ano, jsem Petr."
              ]
            },
            {
              "mn": "Таныг хэн гэдэг вэ?",
              "models": [
                "Jak se jmenujete?"
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "To je",
          "mn": "Энэ бол …",
          "hint": "Жишээ: To je Anna.",
          "example": "To je Anna."
        },
        {
          "type": "learn",
          "cz": "Kdo je to?",
          "mn": "Энэ хэн бэ?"
        },
        {
          "type": "match",
          "pairs": [
            [
              "To je Anna.",
              "Энэ бол Анна."
            ],
            [
              "Kdo je to?",
              "Энэ хэн бэ?"
            ],
            [
              "Jsem Petr.",
              "Би Петр байна."
            ],
            [
              "Těší mě.",
              "Танилцсандаа таатай байна."
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "Kdo je to?",
              "options": [
                "Jak se jmenujete?",
                "Kdo je to?",
                "Jak se máte?"
              ]
            },
            {
              "cz": "To je Anna.",
              "options": [
                "Jmenuji se Anna.",
                "To je Anna.",
                "Jste Petr?"
              ]
            }
          ]
        },
        {
          "type": "gap",
          "prompt": "To ___ Petr.",
          "options": [
            "se",
            "je",
            "mě"
          ],
          "answer": "je",
          "cz": "To je Petr."
        },
        {
          "type": "build",
          "mn": "Энэ бол Анна.",
          "tokens": [
            "Anna.",
            "je",
            "To"
          ],
          "answer": [
            "To",
            "je",
            "Anna."
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Kdo je to?",
              "mn": "Дэргэдэх хүнийг Петр гэж танилцуул.",
              "models": [
                "To je Petr."
              ]
            },
            {
              "partner": "Dobrý den. Jmenuji se Anna.",
              "mn": "Мэндэлж, танилцсандаа таатай байгаагаа хэл.",
              "models": [
                "Dobrý den. Těší mě.",
                "Těší mě."
              ]
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Энэ хэн бэ?",
              "models": [
                "Kdo je to?"
              ]
            },
            {
              "mn": "Энэ бол Анна.",
              "models": [
                "To je Anna."
              ]
            },
            {
              "mn": "Энэ бол Петр.",
              "models": [
                "To je Petr."
              ]
            }
          ]
        }
      ],
      "review_status": "legacy_draft_unvalidated"
    },
    {
      "id": "A0-T02-L07",
      "title": "Тэр эрэгтэй, тэр эмэгтэй",
      "goal": "Эрэгтэй, эмэгтэй хүнийг ялган нэрээр нь танилцуулах",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Энэ хэн бэ?",
              "models": [
                "Kdo je to?"
              ]
            },
            {
              "mn": "Энэ бол Анна.",
              "models": [
                "To je Anna."
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "on",
          "mn": "тэр (эрэгтэй)",
          "hint": "Эрэгтэй хүнийг заана."
        },
        {
          "type": "learn",
          "cz": "ona",
          "mn": "тэр (эмэгтэй)",
          "hint": "Эмэгтэй хүнийг заана. Ona je Anna. — Тэр эмэгтэй бол Анна."
        },
        {
          "type": "learn",
          "cz": "je",
          "mn": "байна (тэр)",
          "hint": "On/ona-тай ижил je хэрэглэнэ.",
          "example": "On je Petr."
        },
        {
          "type": "match",
          "pairs": [
            [
              "on",
              "тэр (эрэгтэй)"
            ],
            [
              "ona",
              "тэр (эмэгтэй)"
            ],
            [
              "je",
              "байна (тэр)"
            ],
            [
              "To je Anna.",
              "Энэ бол Анна."
            ],
            [
              "Kdo je to?",
              "Энэ хэн бэ?"
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "On je Petr.",
              "options": [
                "To je Anna.",
                "On je Petr.",
                "Kdo je to?"
              ]
            },
            {
              "cz": "on",
              "options": [
                "ona",
                "on",
                "je"
              ]
            }
          ]
        },
        {
          "type": "build",
          "mn": "Тэр эрэгтэй бол Петр.",
          "tokens": [
            "Petr.",
            "je",
            "On"
          ],
          "answer": [
            "On",
            "je",
            "Petr."
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Kdo je to?",
              "mn": "Эрэгтэй хүнийг Петр гэж танилцуул.",
              "models": [
                "To je Petr.",
                "On je Petr."
              ]
            },
            {
              "partner": "Kdo je to?",
              "mn": "Эмэгтэй хүнийг Анна гэж танилцуул.",
              "models": [
                "To je Anna.",
                "Ona je Anna."
              ]
            },
            {
              "partner": "Těší mě.",
              "mn": "Танилцсандаа таатай байгаагаа хэл.",
              "models": [
                "Těší mě."
              ]
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Тэр эрэгтэй бол Петр.",
              "models": [
                "On je Petr."
              ]
            },
            {
              "mn": "Тэр эмэгтэй бол Анна.",
              "models": [
                "Ona je Anna."
              ]
            },
            {
              "mn": "Энэ хэн бэ?",
              "models": [
                "Kdo je to?"
              ]
            }
          ]
        }
      ],
      "review_status": "legacy_draft_unvalidated"
    },
    {
      "id": "A0-T02-L08",
      "title": "Тэр ч бас сайн байна",
      "goal": "Өөр хүний байдлыг товч хэлж, бас гэсэн утгыг илэрхийлэх",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Тэр эрэгтэй бол Петр.",
              "models": [
                "On je Petr."
              ]
            },
            {
              "mn": "Та ямар байна?",
              "models": [
                "Jak se máte?"
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "taky",
          "mn": "бас, мөн",
          "hint": "Өдөр тутмын ярианд түгээмэл."
        },
        {
          "type": "learn",
          "cz": "Jak se má?",
          "mn": "Тэр ямар байна?",
          "hint": "Гуравдугаар биеийн асуулт."
        },
        {
          "type": "learn",
          "cz": "Má se dobře.",
          "mn": "Тэр сайн байгаа.",
          "hint": "Тогтсон хэллэгээр сурна."
        },
        {
          "type": "match",
          "pairs": [
            [
              "taky",
              "бас, мөн"
            ],
            [
              "Jak se má?",
              "Тэр ямар байна?"
            ],
            [
              "Má se dobře.",
              "Тэр сайн байгаа."
            ],
            [
              "Jak se máte?",
              "Та ямар байна?"
            ],
            [
              "Dobře, děkuji.",
              "Сайн, баярлалаа."
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "Jak se má?",
              "options": [
                "Jak se máte?",
                "Jak se má?",
                "Kdo je to?"
              ]
            },
            {
              "cz": "Má se dobře.",
              "options": [
                "Dobře, děkuji.",
                "Má se dobře.",
                "Ujde to."
              ]
            }
          ]
        },
        {
          "type": "build",
          "mn": "Тэр ч бас сайн байгаа.",
          "tokens": [
            "dobře.",
            "Taky",
            "má",
            "se"
          ],
          "answer": [
            "Taky",
            "se",
            "má",
            "dobře."
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "To je Anna.",
              "mn": "Анна ямар байгааг асуу.",
              "models": [
                "Jak se má?"
              ]
            },
            {
              "partner": "Má se dobře.",
              "mn": "Анна сайн байгаа. Петр ч бас сайн байгаа гэж хэл (Петрийг зааж байгаа нөхцөл).",
              "models": [
                "Taky se má dobře.",
                "Má se taky dobře."
              ]
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Тэр ямар байна?",
              "models": [
                "Jak se má?"
              ]
            },
            {
              "mn": "Тэр сайн байгаа.",
              "models": [
                "Má se dobře."
              ]
            },
            {
              "mn": "Тэр ч бас сайн байгаа.",
              "models": [
                "Taky se má dobře.",
                "Má se taky dobře."
              ]
            }
          ]
        }
      ],
      "review_status": "legacy_draft_unvalidated"
    },
    {
      "id": "A0-T02-L09",
      "title": "Чи ба Та",
      "goal": "Дотно болон хүндэтгэлийн харилцаанд тохирох биеийн хэлбэр сонгох",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Найзтайгаа мэндэл.",
              "models": [
                "Ahoj!"
              ]
            },
            {
              "mn": "Танихгүй хүнтэй мэндэл.",
              "models": [
                "Dobrý den."
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "ty",
          "mn": "чи (дотно)",
          "hint": "Найз, ойр дотнын хүнтэй."
        },
        {
          "type": "learn",
          "cz": "vy",
          "mn": "та (хүндэтгэлтэй) / та нар",
          "hint": "Нэг хүнд хүндэтгэлтэй эсвэл олон хүнд."
        },
        {
          "type": "learn",
          "cz": "jsi",
          "mn": "чи байна",
          "hint": "Дотно харилцаанд ty jsi; хүндэтгэлтэй үед vy jste.",
          "example": "Jsi Petr?"
        },
        {
          "type": "match",
          "pairs": [
            [
              "ty",
              "чи (дотно)"
            ],
            [
              "vy",
              "та / та нар"
            ],
            [
              "jsi",
              "чи байна"
            ],
            [
              "Jste Petr?",
              "Та Петр мөн үү?"
            ],
            [
              "Jsi Petr?",
              "Чи Петр мөн үү?"
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "Jsi Petr?",
              "options": [
                "Jste Petr?",
                "Jsi Petr?",
                "Jsem Petr."
              ]
            },
            {
              "cz": "Jste Petr?",
              "options": [
                "Jsem Petr.",
                "Jsi Petr?",
                "Jste Petr?"
              ]
            }
          ]
        },
        {
          "type": "context",
          "prompt": "Танихгүй насанд хүрсэн хүнээс Петр мөн эсэхийг хүндэтгэлтэй лавла.",
          "options": [
            "Jsi Petr?",
            "Jste Petr?",
            "Jsem Petr."
          ],
          "answer": "Jste Petr?"
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Ahoj!",
              "mn": "Мэндлээд найзынхаа нэрийг лавла.",
              "models": [
                "Ahoj! Jsi Petr?"
              ]
            },
            {
              "partner": "Dobrý den.",
              "mn": "Мэндлээд танихгүй хүнээс Петр мөн эсэхийг лавла.",
              "models": [
                "Dobrý den. Jste Petr?"
              ]
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Чи Петр мөн үү?",
              "models": [
                "Jsi Petr?"
              ]
            },
            {
              "mn": "Та Петр мөн үү?",
              "models": [
                "Jste Petr?"
              ]
            },
            {
              "mn": "Найзтайгаа мэндлээд Петр мөн эсэхийг лавла.",
              "models": [
                "Ahoj! Jsi Petr?"
              ]
            }
          ]
        }
      ],
      "review_status": "legacy_draft_unvalidated"
    },
    {
      "id": "A0-T02-L10",
      "title": "Чамайг, Таныг хэн гэдэг вэ?",
      "goal": "Албан болон дотно нөхцөлд нэр асууж, харилцан танилцах",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Таныг хэн гэдэг вэ?",
              "models": [
                "Jak se jmenujete?"
              ]
            },
            {
              "mn": "Чи Петр мөн үү?",
              "models": [
                "Jsi Petr?"
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "Jak se jmenuješ?",
          "mn": "Чамайг хэн гэдэг вэ?",
          "hint": "Дотно харилцааны нэр асуух хэлбэр."
        },
        {
          "type": "learn",
          "cz": "A ty?",
          "mn": "Харин чи?",
          "hint": "Дотно харилцаанд асуулт буцаах."
        },
        {
          "type": "match",
          "pairs": [
            [
              "Jak se jmenuješ?",
              "Чамайг хэн гэдэг вэ?"
            ],
            [
              "Jak se jmenujete?",
              "Таныг хэн гэдэг вэ?"
            ],
            [
              "A ty?",
              "Харин чи?"
            ],
            [
              "A vy?",
              "Харин та?"
            ],
            [
              "Jmenuji se Anna.",
              "Намайг Анна гэдэг."
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "Jak se jmenuješ?",
              "options": [
                "Jak se jmenujete?",
                "Jak se jmenuješ?",
                "Jak se má?"
              ]
            },
            {
              "cz": "A ty?",
              "options": [
                "A vy?",
                "A ty?",
                "Těší mě."
              ]
            }
          ]
        },
        {
          "type": "gap",
          "prompt": "Jak se ___? (дотно)",
          "options": [
            "jmenuješ",
            "jmenujete",
            "máte"
          ],
          "answer": "jmenuješ",
          "cz": "Jak se jmenuješ?"
        },
        {
          "type": "build",
          "mn": "Сайн уу! Чамайг хэн гэдэг вэ?",
          "tokens": [
            "se",
            "Ahoj!",
            "jmenuješ?",
            "Jak"
          ],
          "answer": [
            "Ahoj!",
            "Jak",
            "se",
            "jmenuješ?"
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Ahoj!",
              "mn": "Дотно мэндлээд нэрийг нь асуу.",
              "models": [
                "Ahoj! Jak se jmenuješ?"
              ]
            },
            {
              "partner": "Jmenuji se Anna. A ty?",
              "mn": "Петрийн дүрд нэрээ хэл.",
              "models": [
                "Jmenuji se Petr.",
                "Jsem Petr."
              ]
            },
            {
              "partner": "Těší mě.",
              "mn": "Танилцсандаа таатай байгаагаа хэл.",
              "models": [
                "Těší mě."
              ]
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Чамайг хэн гэдэг вэ?",
              "models": [
                "Jak se jmenuješ?"
              ]
            },
            {
              "mn": "Харин чи?",
              "models": [
                "A ty?"
              ]
            },
            {
              "mn": "Таныг хэн гэдэг вэ?",
              "models": [
                "Jak se jmenujete?"
              ]
            },
            {
              "mn": "Өөрийн нэрээ хэлээд дотно хэлбэрээр хариу асуу.",
              "models": [
                "Jmenuji se Petr. A ty?"
              ],
              "open": true
            }
          ]
        }
      ],
      "review_status": "legacy_draft_unvalidated"
    },
    {
      "id": "A0-T02-L11",
      "title": "Миний нэр, түүний нэр",
      "goal": "Өөрийн болон бусдын нэрийг эзэмшлийн хэллэгээр хэлэх",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Намайг Анна гэдэг.",
              "models": [
                "Jmenuji se Anna."
              ]
            },
            {
              "mn": "Тэр эрэгтэй бол Петр.",
              "models": [
                "On je Petr."
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "Moje jméno je",
          "mn": "Миний нэр …",
          "hint": "jméno нь саармаг хүйстэй; moje хэрэглэнэ. Өдөр тутам Jmenuji se… гэж хэлэх нь бас хэвийн.",
          "example": "Moje jméno je Anna."
        },
        {
          "type": "learn",
          "cz": "Jeho jméno je",
          "mn": "Тэр эрэгтэйн нэр …",
          "hint": "jeho нь эзэмшигч эрэгтэйг заана.",
          "example": "Jeho jméno je Petr."
        },
        {
          "type": "learn",
          "cz": "Její jméno je",
          "mn": "Тэр эмэгтэйн нэр …",
          "hint": "její нь эзэмшигч эмэгтэйг заана.",
          "example": "Její jméno je Anna."
        },
        {
          "type": "match",
          "pairs": [
            [
              "Moje jméno je",
              "Миний нэр …"
            ],
            [
              "Jeho jméno je",
              "Тэр эрэгтэйн нэр …"
            ],
            [
              "Její jméno je",
              "Тэр эмэгтэйн нэр …"
            ],
            [
              "Jmenuji se Anna.",
              "Намайг Анна гэдэг."
            ],
            [
              "Kdo je to?",
              "Энэ хэн бэ?"
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "Jeho jméno je Petr.",
              "options": [
                "Moje jméno je Anna.",
                "Jeho jméno je Petr.",
                "Její jméno je Anna."
              ]
            },
            {
              "cz": "Její jméno je Anna.",
              "options": [
                "Její jméno je Anna.",
                "Jeho jméno je Petr.",
                "Moje jméno je Anna."
              ]
            }
          ]
        },
        {
          "type": "build",
          "mn": "Тэр эмэгтэйн нэр Анна.",
          "tokens": [
            "Anna.",
            "je",
            "Její",
            "jméno"
          ],
          "answer": [
            "Její",
            "jméno",
            "je",
            "Anna."
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Kdo je to?",
              "mn": "Петр гэдэг эрэгтэйг зааж, түүний нэрийг хэл.",
              "models": [
                "Jeho jméno je Petr.",
                "On je Petr.",
                "To je Petr."
              ]
            },
            {
              "partner": "Kdo je to?",
              "mn": "Анна гэдэг эмэгтэйг зааж, түүний нэрийг хэл.",
              "models": [
                "Její jméno je Anna.",
                "Ona je Anna.",
                "To je Anna."
              ]
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Миний нэр Анна.",
              "models": [
                "Moje jméno je Anna.",
                "Jmenuji se Anna."
              ]
            },
            {
              "mn": "Тэр эрэгтэйн нэр Петр.",
              "models": [
                "Jeho jméno je Petr."
              ]
            },
            {
              "mn": "Тэр эмэгтэйн нэр Анна.",
              "models": [
                "Její jméno je Anna."
              ]
            }
          ]
        }
      ],
      "review_status": "legacy_draft_unvalidated"
    },
    {
      "id": "A0-T02-L12",
      "title": "Хэн бэ? Танилцъя",
      "goal": "Бусдын нэрийг асууж хэлэх, танилцуулах",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Тэр эмэгтэйн нэр Анна.",
              "models": [
                "Její jméno je Anna."
              ]
            },
            {
              "mn": "Энэ хэн бэ?",
              "models": [
                "Kdo je to?"
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "Jak se jmenuje?",
          "mn": "Түүнийг хэн гэдэг вэ?",
          "hint": "Эрэгтэй, эмэгтэй хүнд ижил асуулт."
        },
        {
          "type": "learn",
          "cz": "Jmenuje se",
          "mn": "Түүнийг … гэдэг.",
          "hint": "Тэр хүний нэрийг араас нь хэлнэ.",
          "example": "Jmenuje se Anna."
        },
        {
          "type": "match",
          "pairs": [
            [
              "Jak se jmenuje?",
              "Түүнийг хэн гэдэг вэ?"
            ],
            [
              "Jmenuje se Anna.",
              "Түүнийг Анна гэдэг."
            ],
            [
              "Jak se jmenujete?",
              "Таныг хэн гэдэг вэ?"
            ],
            [
              "Jak se jmenuješ?",
              "Чамайг хэн гэдэг вэ?"
            ],
            [
              "Těší mě.",
              "Танилцсандаа таатай байна."
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "Jak se jmenuje?",
              "options": [
                "Jak se jmenujete?",
                "Jak se jmenuje?",
                "Jak se jmenuješ?"
              ]
            },
            {
              "cz": "Jmenuje se Anna.",
              "options": [
                "Jmenuje se Anna.",
                "Jmenuji se Anna.",
                "Její jméno je Anna."
              ]
            }
          ]
        },
        {
          "type": "gap",
          "prompt": "Jak se ___? (өөр хүний нэрийг асуух)",
          "options": [
            "jmenuje",
            "jmenuji",
            "jmenujete"
          ],
          "answer": "jmenuje",
          "cz": "Jak se jmenuje?"
        },
        {
          "type": "build",
          "mn": "Түүнийг Петр гэдэг.",
          "tokens": [
            "Petr.",
            "se",
            "Jmenuje"
          ],
          "answer": [
            "Jmenuje",
            "se",
            "Petr."
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Dobrý den.",
              "mn": "Хажууд байгаа танихгүй хүний нэрийг асуу.",
              "models": [
                "Jak se jmenuje?"
              ]
            },
            {
              "partner": "Jak se jmenuje?",
              "mn": "Эрэгтэй хүнийг Петр гэдэг гэж хэл.",
              "models": [
                "Jmenuje se Petr.",
                "Jeho jméno je Petr."
              ]
            },
            {
              "partner": "Těší mě.",
              "mn": "Танилцсандаа таатай байгаагаа хэл.",
              "models": [
                "Těší mě."
              ]
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Түүнийг хэн гэдэг вэ?",
              "models": [
                "Jak se jmenuje?"
              ]
            },
            {
              "mn": "Түүнийг Анна гэдэг.",
              "models": [
                "Jmenuje se Anna."
              ]
            },
            {
              "mn": "Түүнийг Петр гэдэг.",
              "models": [
                "Jmenuje se Petr."
              ]
            }
          ]
        }
      ],
      "review_status": "legacy_draft_unvalidated"
    },
    {
      "id": "A0-T02-L13",
      "title": "Миний найз, багш",
      "goal": "Өөрийн найз, багшийг танилцуулах",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Түүнийг хэн гэдэг вэ?",
              "models": [
                "Jak se jmenuje?"
              ]
            },
            {
              "mn": "Энэ бол Петр.",
              "models": [
                "To je Petr."
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "můj kamarád",
          "mn": "миний эрэгтэй найз",
          "hint": "Эрэгтэй хүйстэй kamarád-д můj.",
          "example": "To je můj kamarád."
        },
        {
          "type": "learn",
          "cz": "moje kamarádka",
          "mn": "миний эмэгтэй найз",
          "hint": "Эмэгтэй хүйстэй kamarádka-д moje.",
          "example": "To je moje kamarádka."
        },
        {
          "type": "learn",
          "cz": "můj učitel",
          "mn": "миний эрэгтэй багш",
          "hint": "Эрэгтэй хүйстэй učitel-д můj.",
          "example": "To je můj učitel."
        },
        {
          "type": "match",
          "pairs": [
            [
              "můj kamarád",
              "миний эрэгтэй найз"
            ],
            [
              "moje kamarádka",
              "миний эмэгтэй найз"
            ],
            [
              "můj učitel",
              "миний эрэгтэй багш"
            ],
            [
              "Kdo je to?",
              "Энэ хэн бэ?"
            ],
            [
              "Moje jméno je Anna.",
              "Миний нэр Анна."
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "To je můj kamarád.",
              "options": [
                "To je můj učitel.",
                "To je můj kamarád.",
                "To je moje kamarádka."
              ]
            },
            {
              "cz": "To je moje kamarádka.",
              "options": [
                "To je můj kamarád.",
                "To je moje kamarádka.",
                "To je můj učitel."
              ]
            }
          ]
        },
        {
          "type": "build",
          "mn": "Энэ миний эрэгтэй багш.",
          "tokens": [
            "učitel.",
            "je",
            "To",
            "můj"
          ],
          "answer": [
            "To",
            "je",
            "můj",
            "učitel."
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Kdo je to?",
              "mn": "Энэ хүн чиний эрэгтэй найз гэж хэл.",
              "models": [
                "To je můj kamarád."
              ]
            },
            {
              "partner": "Jak se jmenuje?",
              "mn": "Найзыг Петр гэдэг гэж хэл.",
              "models": [
                "Jmenuje se Petr."
              ]
            },
            {
              "partner": "Kdo je to?",
              "mn": "Энэ хүн чиний эмэгтэй найз гэж хэл.",
              "models": [
                "To je moje kamarádka."
              ]
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Миний эрэгтэй найз.",
              "models": [
                "můj kamarád"
              ]
            },
            {
              "mn": "Энэ миний эмэгтэй найз.",
              "models": [
                "To je moje kamarádka."
              ]
            },
            {
              "mn": "Энэ миний эрэгтэй багш.",
              "models": [
                "To je můj učitel."
              ]
            }
          ]
        }
      ],
      "review_status": "legacy_draft_unvalidated"
    },
    {
      "id": "A0-T02-L14",
      "title": "Түүний найз, түүний багш",
      "goal": "Найз, багшийн эзэмшигчийг ялгаж хэлэх",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Энэ миний эрэгтэй найз.",
              "models": [
                "To je můj kamarád."
              ]
            },
            {
              "mn": "Тэр эмэгтэйн нэр Анна.",
              "models": [
                "Její jméno je Anna."
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "jeho kamarád",
          "mn": "тэр эрэгтэйн эрэгтэй найз",
          "hint": "jeho нь эзэмшигчийг заана.",
          "example": "To je jeho kamarád."
        },
        {
          "type": "learn",
          "cz": "její kamarádka",
          "mn": "тэр эмэгтэйн эмэгтэй найз",
          "hint": "její нь эзэмшигчийг заана.",
          "example": "To je její kamarádka."
        },
        {
          "type": "learn",
          "cz": "její učitelka",
          "mn": "тэр эмэгтэйн эмэгтэй багш",
          "hint": "učitelka = эмэгтэй багш.",
          "example": "To je její učitelka."
        },
        {
          "type": "match",
          "pairs": [
            [
              "jeho kamarád",
              "тэр эрэгтэйн эрэгтэй найз"
            ],
            [
              "její kamarádka",
              "тэр эмэгтэйн эмэгтэй найз"
            ],
            [
              "její učitelka",
              "тэр эмэгтэйн эмэгтэй багш"
            ],
            [
              "můj učitel",
              "миний эрэгтэй багш"
            ],
            [
              "moje kamarádka",
              "миний эмэгтэй найз"
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "To je jeho kamarád.",
              "options": [
                "To je můj kamarád.",
                "To je jeho kamarád.",
                "To je její kamarádka."
              ]
            },
            {
              "cz": "To je její učitelka.",
              "options": [
                "To je její učitelka.",
                "To je můj učitel.",
                "To je její kamarádka."
              ]
            }
          ]
        },
        {
          "type": "build",
          "mn": "Энэ тэр эрэгтэйн эрэгтэй багш.",
          "tokens": [
            "jeho",
            "učitel.",
            "To",
            "je"
          ],
          "answer": [
            "To",
            "je",
            "jeho",
            "učitel."
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Kdo je to?",
              "mn": "Петрийн эрэгтэй найзыг зааж байна. Энэ түүний найз гэж хэл.",
              "models": [
                "To je jeho kamarád."
              ]
            },
            {
              "partner": "Kdo je to?",
              "mn": "Аннагийн эмэгтэй багшийг зааж байна. Энэ түүний багш гэж хэл.",
              "models": [
                "To je její učitelka."
              ]
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Тэр эрэгтэйн эрэгтэй найз.",
              "models": [
                "jeho kamarád"
              ]
            },
            {
              "mn": "Тэр эмэгтэйн эмэгтэй найз.",
              "models": [
                "její kamarádka"
              ]
            },
            {
              "mn": "Энэ тэр эмэгтэйн эмэгтэй багш.",
              "models": [
                "To je její učitelka."
              ]
            }
          ]
        }
      ],
      "review_status": "legacy_draft_unvalidated"
    },
    {
      "id": "A0-T02-L15",
      "title": "Баярлалаа, маш их баярлалаа",
      "goal": "Талархах, талархалд эелдгээр хариулах",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Сайн, баярлалаа.",
              "models": [
                "Dobře, děkuji."
              ]
            },
            {
              "mn": "Албан ёсоор үд.",
              "models": [
                "Na shledanou."
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "Děkuji.",
          "mn": "Баярлалаа.",
          "hint": "Албан, дотно аль алинд хэрэглэнэ."
        },
        {
          "type": "learn",
          "cz": "Moc děkuji.",
          "mn": "Маш их баярлалаа.",
          "hint": "Өдөр тутмын талархлын хэллэг."
        },
        {
          "type": "learn",
          "cz": "Není zač.",
          "mn": "Зүгээр ээ. / Юу ч биш.",
          "hint": "Хэн нэгэн талархахад хариулна."
        },
        {
          "type": "match",
          "pairs": [
            [
              "Děkuji.",
              "Баярлалаа."
            ],
            [
              "Moc děkuji.",
              "Маш их баярлалаа."
            ],
            [
              "Není zač.",
              "Зүгээр ээ. (талархлын хариу)"
            ],
            [
              "Těší mě.",
              "Танилцсандаа таатай байна."
            ],
            [
              "Na shledanou.",
              "Баяртай."
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "Moc děkuji.",
              "options": [
                "Děkuji.",
                "Moc děkuji.",
                "Není zač."
              ]
            },
            {
              "cz": "Není zač.",
              "options": [
                "Těší mě.",
                "Není zač.",
                "Na shledanou."
              ]
            }
          ]
        },
        {
          "type": "build",
          "mn": "Маш их баярлалаа. Баяртай.",
          "tokens": [
            "shledanou.",
            "děkuji.",
            "Na",
            "Moc"
          ],
          "answer": [
            "Moc",
            "děkuji.",
            "Na",
            "shledanou."
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Děkuji.",
              "mn": "Талархалд эелдгээр хариул.",
              "models": [
                "Není zač."
              ]
            },
            {
              "partner": "Na shledanou.",
              "mn": "Чамд тусалсан хүнд талархаад үд.",
              "models": [
                "Moc děkuji. Na shledanou.",
                "Děkuji. Na shledanou."
              ]
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Баярлалаа.",
              "models": [
                "Děkuji."
              ]
            },
            {
              "mn": "Маш их баярлалаа.",
              "models": [
                "Moc děkuji."
              ]
            },
            {
              "mn": "Хэн нэгэн талархлаа. Зүгээр ээ гэж хариул.",
              "models": [
                "Není zač."
              ]
            }
          ]
        }
      ],
      "review_status": "legacy_draft_unvalidated"
    },
    {
      "id": "A0-T02-L16",
      "title": "Уучлаарай",
      "goal": "Албан ба дотно нөхцөлд уучлал хүсэх",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Маш их баярлалаа.",
              "models": [
                "Moc děkuji."
              ]
            },
            {
              "mn": "Танихгүй хүнтэй мэндэл.",
              "models": [
                "Dobrý den."
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "Promiňte.",
          "mn": "Уучлаарай. (хүндэтгэлтэй)",
          "hint": "Танихгүй хүн, ажилтнаас уучлал хүсэхэд."
        },
        {
          "type": "learn",
          "cz": "Promiň.",
          "mn": "Уучлаарай. (дотно)",
          "hint": "Найз, ойр дотнын хүнд."
        },
        {
          "type": "learn",
          "cz": "Omlouvám se.",
          "mn": "Би уучлал хүсэж байна.",
          "hint": "Албан болон дотно нөхцөлд хэрэглэж болно."
        },
        {
          "type": "match",
          "pairs": [
            [
              "Promiňte.",
              "Уучлаарай. (хүндэтгэлтэй)"
            ],
            [
              "Promiň.",
              "Уучлаарай. (дотно)"
            ],
            [
              "Omlouvám se.",
              "Би уучлал хүсэж байна."
            ],
            [
              "Děkuji.",
              "Баярлалаа."
            ],
            [
              "Ahoj!",
              "Сайн уу! (дотно)"
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "Promiňte.",
              "options": [
                "Promiň.",
                "Promiňte.",
                "Děkuji."
              ]
            },
            {
              "cz": "Omlouvám se.",
              "options": [
                "Omlouvám se.",
                "Promiňte.",
                "Není zač."
              ]
            }
          ]
        },
        {
          "type": "context",
          "prompt": "Танихгүй хүнтэй санамсаргүй мөргөлдсөн. Хүндэтгэлийн богино хэлбэрийг сонго.",
          "options": [
            "Promiň.",
            "Promiňte.",
            "Moc děkuji."
          ],
          "answer": "Promiňte."
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Ahoj!",
              "mn": "Найзаасаа дотно хэлбэрээр уучлал хүс.",
              "models": [
                "Promiň.",
                "Omlouvám se."
              ]
            },
            {
              "partner": "Dobrý den.",
              "mn": "Танихгүй хүнээс эелдгээр уучлал хүс.",
              "models": [
                "Promiňte.",
                "Omlouvám se."
              ]
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Найзаасаа богино дотно хэлбэрээр уучлал хүс.",
              "models": [
                "Promiň."
              ]
            },
            {
              "mn": "Танихгүй хүнээс богино хүндэтгэлийн хэлбэрээр уучлал хүс.",
              "models": [
                "Promiňte."
              ]
            },
            {
              "mn": "Би уучлал хүсэж байна.",
              "models": [
                "Omlouvám se."
              ]
            }
          ]
        }
      ],
      "review_status": "legacy_draft_unvalidated"
    },
    {
      "id": "A0-T02-L17",
      "title": "Гуйя, туслаач",
      "goal": "Танихгүй хүнээс эелдгээр тусламж хүсэх, талархах",
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Танихгүй хүнээс уучлал хүс.",
              "models": [
                "Promiňte.",
                "Omlouvám se."
              ]
            },
            {
              "mn": "Баярлалаа.",
              "models": [
                "Děkuji."
              ]
            }
          ]
        },
        {
          "type": "learn",
          "cz": "Prosím.",
          "mn": "Гуйя. (хүсэлтэд)",
          "hint": "Хүсэлтийг эелдэг болгоно. Бусад нөхцөлд өөр утгатай."
        },
        {
          "type": "learn",
          "cz": "Můžete mi pomoci?",
          "mn": "Та надад тусалж чадах уу?",
          "hint": "Хүндэтгэлийн эелдэг асуулт."
        },
        {
          "type": "learn",
          "cz": "Pomozte mi, prosím.",
          "mn": "Надад туслаач, гуйя.",
          "hint": "Хүндэтгэлийн шууд хүсэлт."
        },
        {
          "type": "match",
          "pairs": [
            [
              "Prosím.",
              "Гуйя. (хүсэлтэд)"
            ],
            [
              "Můžete mi pomoci?",
              "Та надад тусалж чадах уу?"
            ],
            [
              "Pomozte mi, prosím.",
              "Надад туслаач, гуйя."
            ],
            [
              "Promiňte.",
              "Уучлаарай. (хүндэтгэлтэй)"
            ],
            [
              "Děkuji.",
              "Баярлалаа."
            ]
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "Můžete mi pomoci?",
              "options": [
                "Pomozte mi, prosím.",
                "Můžete mi pomoci?",
                "Promiňte."
              ]
            },
            {
              "cz": "Pomozte mi, prosím.",
              "options": [
                "Můžete mi pomoci?",
                "Děkuji.",
                "Pomozte mi, prosím."
              ]
            }
          ]
        },
        {
          "type": "build",
          "mn": "Уучлаарай. Та надад тусалж чадах уу?",
          "tokens": [
            "pomoci?",
            "mi",
            "Promiňte.",
            "Můžete"
          ],
          "answer": [
            "Promiňte.",
            "Můžete",
            "mi",
            "pomoci?"
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Dobrý den.",
              "mn": "Мэндлээд эелдгээр тусламж хүс.",
              "models": [
                "Dobrý den. Můžete mi pomoci?"
              ]
            },
            {
              "partner": "Ano.",
              "mn": "Харилцагч туслахаар зөвшөөрлөө. Маш их баярлалаа гэж хэл.",
              "models": [
                "Moc děkuji."
              ]
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Та надад тусалж чадах уу?",
              "models": [
                "Můžete mi pomoci?"
              ]
            },
            {
              "mn": "Надад туслаач, гуйя.",
              "models": [
                "Pomozte mi, prosím."
              ]
            },
            {
              "mn": "Уучлаарай. Та надад тусалж чадах уу?",
              "models": [
                "Promiňte. Můžete mi pomoci?"
              ]
            }
          ]
        }
      ],
      "review_status": "legacy_draft_unvalidated"
    },
    {
      "id": "A0-T02-L18",
      "title": "Бие даан танилцах нэгдсэн сорил",
      "goal": "Өмнөх 17 хичээлд сурсан хэллэгээр шинэ нөхцөлд мэндлэх, танилцах, тусламж хүсэх, үдэх",
      "assessment": true,
      "steps": [
        {
          "type": "recall",
          "items": [
            {
              "mn": "Танихгүй хүнтэй өдрийн цагаар мэндэл.",
              "models": [
                "Dobrý den."
              ]
            },
            {
              "mn": "Найзаасаа нэрийг нь асуу.",
              "models": [
                "Jak se jmenuješ?"
              ]
            }
          ]
        },
        {
          "type": "listen",
          "items": [
            {
              "cz": "Jak se jmenujete?",
              "options": [
                "Jak se jmenujete?",
                "Jak se jmenuješ?",
                "Jak se jmenuje?"
              ]
            },
            {
              "cz": "Můžete mi pomoci?",
              "options": [
                "Pomozte mi, prosím.",
                "Můžete mi pomoci?",
                "Jak se máte?"
              ]
            },
            {
              "cz": "Není zač.",
              "options": [
                "Děkuji.",
                "Na shledanou.",
                "Není zač."
              ]
            }
          ]
        },
        {
          "type": "context",
          "prompt": "Танихгүй насанд хүрсэн хүний нэрийг асуухдаа аль хэлбэрийг хэрэглэх вэ?",
          "options": [
            "Jak se jmenuje?",
            "Jak se jmenuješ?",
            "Jak se jmenujete?"
          ],
          "answer": "Jak se jmenujete?"
        },
        {
          "type": "match",
          "pairs": [
            [
              "Jeho jméno je Petr.",
              "Тэр эрэгтэйн нэр Петр."
            ],
            [
              "To je moje kamarádka.",
              "Энэ миний эмэгтэй найз."
            ],
            [
              "Omlouvám se.",
              "Би уучлал хүсэж байна."
            ],
            [
              "A vy?",
              "Харин та?"
            ],
            [
              "Není zač.",
              "Зүгээр ээ. (талархлын хариу)"
            ]
          ]
        },
        {
          "type": "build",
          "mn": "Сайн, баярлалаа. Харин та?",
          "tokens": [
            "vy?",
            "děkuji.",
            "A",
            "Dobře,"
          ],
          "answer": [
            "Dobře,",
            "děkuji.",
            "A",
            "vy?"
          ]
        },
        {
          "type": "gap",
          "prompt": "To je ___ kamarádka. (миний)",
          "options": [
            "moje",
            "můj",
            "jeho"
          ],
          "answer": "moje",
          "cz": "To je moje kamarádka."
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Dobrý den. Jak se jmenujete?",
              "mn": "Мэндлээд өөрийн нэрээ хэл.",
              "models": [
                "Dobrý den. Jmenuji se Petr.",
                "Dobrý den. Jsem Anna."
              ],
              "open": true
            },
            {
              "partner": "Těší mě.",
              "mn": "Танилцсандаа таатай байгаагаа хэл.",
              "models": [
                "Těší mě."
              ]
            },
            {
              "partner": "Jak se máte?",
              "mn": "Сайн байгаагаа хэлээд хариу асуу.",
              "models": [
                "Dobře, děkuji. A vy?"
              ]
            }
          ]
        },
        {
          "type": "dialogue",
          "items": [
            {
              "partner": "Dobrý den.",
              "mn": "Танихгүй ажилтнаас эелдгээр тусламж хүс.",
              "models": [
                "Promiňte. Můžete mi pomoci?",
                "Dobrý den. Můžete mi pomoci?"
              ]
            },
            {
              "partner": "Ano.",
              "mn": "Тусалсан хүнд талархаад албан ёсоор үд.",
              "models": [
                "Moc děkuji. Na shledanou.",
                "Děkuji. Na shledanou."
              ]
            }
          ]
        },
        {
          "type": "recall",
          "items": [
            {
              "mn": "Танихгүй хүнтэй мэндлээд өөрийн жинхэнэ нэрээр танилцуул.",
              "models": [
                "Dobrý den. Jmenuji se Petr."
              ],
              "open": true
            },
            {
              "mn": "Танихгүй хүнээс нэрийг нь асуу.",
              "models": [
                "Jak se jmenujete?"
              ]
            },
            {
              "mn": "Энэ миний эмэгтэй найз.",
              "models": [
                "To je moje kamarádka."
              ]
            },
            {
              "mn": "Уучлаарай, та надад тусалж чадах уу?",
              "models": [
                "Promiňte. Můžete mi pomoci?"
              ]
            },
            {
              "mn": "Маш их баярлалаа. Баяртай.",
              "models": [
                "Moc děkuji. Na shledanou."
              ]
            }
          ]
        }
      ],
      "review_status": "legacy_draft_unvalidated"
    }
  ],
  "curriculum_status": "pilot_only"
};
