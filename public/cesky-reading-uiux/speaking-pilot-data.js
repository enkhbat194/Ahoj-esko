window.AHOJ_SPEAKING_PILOT = {
  "version": 1,
  "source": "Speaking Pilot v1.0; L01–L10 aligned to existing 18-lesson A0-T02 outline; L07–L10 editorial review pending",
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
          "type": "dialogue",
          "items": [
            {
              "partner": "Dobrý den.",
              "mn": "Үйлчилгээний ажилтантай мэндэл.",
              "models": [
                "Dobrý den."
              ]
            },
            {
              "partner": "Na shledanou.",
              "mn": "Эелдгээр үд.",
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
      ]
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
          "type": "dialogue",
          "items": [
            {
              "partner": "Dobrý den. Jmenuji se Anna.",
              "mn": "Мэндлээд өөрийгөө Петр гэж танилцуул.",
              "models": [
                "Dobrý den. Jmenuji se Petr.",
                "Dobrý den. Jsem Petr."
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
      ]
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
          "type": "dialogue",
          "items": [
            {
              "partner": "Dobrý den.",
              "mn": "Мэндлээд нэрийг нь асуу.",
              "models": [
                "Dobrý den. Jak se jmenujete?"
              ]
            },
            {
              "partner": "Jmenuji se Anna. A vy?",
              "mn": "Өөрийгөө танилцуул.",
              "models": [
                "Jmenuji se Petr.",
                "Jsem Petr."
              ],
              "open": true
            },
            {
              "partner": "Těší mě.",
              "mn": "Хариулаад үдээрэй.",
              "models": [
                "Těší mě. Na shledanou."
              ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
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
      ]
    }
  ]
};
