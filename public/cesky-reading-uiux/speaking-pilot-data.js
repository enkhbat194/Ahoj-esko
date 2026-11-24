window.AHOJ_SPEAKING_PILOT = {
  "version": 1,
  "source": "Speaking Pilot v1.0 README_MN.md; original curriculum retained",
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
    }
  ]
};
