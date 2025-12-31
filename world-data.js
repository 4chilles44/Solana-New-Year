// Comprehensive World New Year Data
// All countries, timezones, flag colors, and Happy New Year translations

const WORLD_DATA = {
    // UTC+14 (Kiribati - Line Islands)
    "+14": {
        countries: [
            {
                name: "Kiribati",
                colors: ["#CE1126", "#FFFFFF", "#003F87"],
                greeting: "Te Ataei ni Karaki Bong",
                emoji: "🇰🇮"
            }
        ]
    },

    // UTC+13 (New Zealand, Samoa, Tonga)
    "+13": {
        countries: [
            {
                name: "New Zealand",
                colors: ["#00247D", "#FFFFFF", "#CC142B"],
                greeting: "Kia hari te tau hou",
                emoji: "🇳🇿"
            },
            {
                name: "Samoa",
                colors: ["#CE1126", "#FFFFFF", "#002868"],
                greeting: "Manuia le Tausaga Fou",
                emoji: "🇼🇸"
            },
            {
                name: "Tonga",
                colors: ["#CE1126", "#FFFFFF"],
                greeting: "Mālō e tau fo'ou",
                emoji: "🇹🇴"
            }
        ]
    },

    // UTC+12 (Fiji, Marshall Islands, Nauru)
    "+12": {
        countries: [
            {
                name: "Fiji",
                colors: ["#68BFE5", "#FFFFFF", "#CE1126", "#002868"],
                greeting: "Bula vinaka i tau vou",
                emoji: "🇫🇯"
            },
            {
                name: "Marshall Islands",
                colors: ["#003893", "#FFFFFF", "#DD7500"],
                greeting: "Iokwe eok an jibu lalem",
                emoji: "🇲🇭"
            },
            {
                name: "Nauru",
                colors: ["#002170", "#FFC61E", "#FFFFFF"],
                greeting: "Happy New Year",
                emoji: "🇳🇷"
            }
        ]
    },

    // UTC+11 (Solomon Islands, Vanuatu, New Caledonia)
    "+11": {
        countries: [
            {
                name: "Solomon Islands",
                colors: ["#0051BA", "#215B33", "#FCD116", "#FFFFFF"],
                greeting: "Happy New Year",
                emoji: "🇸🇧"
            },
            {
                name: "Vanuatu",
                colors: ["#CE1126", "#009543", "#000000", "#FCD116"],
                greeting: "Hapi Niu Yia",
                emoji: "🇻🇺"
            },
            {
                name: "New Caledonia",
                colors: ["#002395", "#FFFFFF", "#ED2939"],
                greeting: "Bonne Année",
                emoji: "🇳🇨"
            }
        ]
    },

    // UTC+10 (Australia East, Guam, Papua New Guinea)
    "+10": {
        countries: [
            {
                name: "Australia",
                colors: ["#00008B", "#FFFFFF", "#FF0000"],
                greeting: "Happy New Year",
                emoji: "🇦🇺"
            },
            {
                name: "Guam",
                colors: ["#CE1126", "#002868", "#FFFFFF"],
                greeting: "Happy New Year",
                emoji: "🇬🇺"
            },
            {
                name: "Papua New Guinea",
                colors: ["#CE1126", "#000000", "#FCD116", "#FFFFFF"],
                greeting: "Nupela Yia i Kam",
                emoji: "🇵🇬"
            }
        ]
    },

    // UTC+9 (Japan, South Korea, Palau)
    "+9": {
        countries: [
            {
                name: "Japan",
                colors: ["#BC002D", "#FFFFFF"],
                greeting: "明けましておめでとう (Akemashite omedetō)",
                emoji: "🇯🇵"
            },
            {
                name: "South Korea",
                colors: ["#CD2E3A", "#FFFFFF", "#000000", "#003478"],
                greeting: "새해 복 많이 받으세요 (Saehae bok mani badeuseyo)",
                emoji: "🇰🇷"
            },
            {
                name: "Palau",
                colors: ["#4AADD6", "#FFDE00"],
                greeting: "Ungil Lechub",
                emoji: "🇵🇼"
            }
        ]
    },

    // UTC+8 (China, Singapore, Philippines, Malaysia, Taiwan, Brunei, Mongolia)
    "+8": {
        countries: [
            {
                name: "China",
                colors: ["#DE2910", "#FFDE00"],
                greeting: "新年快乐 (Xīnnián kuàilè)",
                emoji: "🇨🇳"
            },
            {
                name: "Singapore",
                colors: ["#ED2939", "#FFFFFF"],
                greeting: "Happy New Year",
                emoji: "🇸🇬"
            },
            {
                name: "Philippines",
                colors: ["#0038A8", "#CE1126", "#FCD116", "#FFFFFF"],
                greeting: "Manigong Bagong Taon",
                emoji: "🇵🇭"
            },
            {
                name: "Malaysia",
                colors: ["#010066", "#CC0001", "#FFFFFF", "#FFCC00"],
                greeting: "Selamat Tahun Baru",
                emoji: "🇲🇾"
            },
            {
                name: "Taiwan",
                colors: ["#FE0000", "#000095", "#FFFFFF"],
                greeting: "新年快樂 (Xīnnián kuàilè)",
                emoji: "🇹🇼"
            },
            {
                name: "Brunei",
                colors: ["#F7E017", "#FFFFFF", "#000000", "#CF1126"],
                greeting: "Selamat Tahun Baru",
                emoji: "🇧🇳"
            },
            {
                name: "Mongolia",
                colors: ["#DA2032", "#015197", "#FFD900"],
                greeting: "Шинэ жилийн мэнд (Shine jiliin mend)",
                emoji: "🇲🇳"
            }
        ]
    },

    // UTC+7 (Thailand, Vietnam, Cambodia, Laos, Indonesia West)
    "+7": {
        countries: [
            {
                name: "Thailand",
                colors: ["#ED1C24", "#FFFFFF", "#241D4F"],
                greeting: "สวัสดีปีใหม่ (Sawatdee Pee Mai)",
                emoji: "🇹🇭"
            },
            {
                name: "Vietnam",
                colors: ["#DA251D", "#FFFF00"],
                greeting: "Chúc mừng năm mới",
                emoji: "🇻🇳"
            },
            {
                name: "Cambodia",
                colors: ["#032EA1", "#E00025", "#FFFFFF"],
                greeting: "រីករាយឆ្នាំថ្មី (Rikreay chnam thmei)",
                emoji: "🇰🇭"
            },
            {
                name: "Laos",
                colors: ["#CE1126", "#002868", "#FFFFFF"],
                greeting: "ສະບາຍດີປີໃໝ່ (Sabaidee pee mai)",
                emoji: "🇱🇦"
            },
            {
                name: "Indonesia",
                colors: ["#FF0000", "#FFFFFF"],
                greeting: "Selamat Tahun Baru",
                emoji: "🇮🇩"
            }
        ]
    },

    // UTC+6 (Bangladesh, Bhutan, Kazakhstan East)
    "+6": {
        countries: [
            {
                name: "Bangladesh",
                colors: ["#006A4E", "#F42A41"],
                greeting: "শুভ নববর্ষ (Shubho noboborsho)",
                emoji: "🇧🇩"
            },
            {
                name: "Bhutan",
                colors: ["#FFD520", "#FF4E12", "#FFFFFF"],
                greeting: "Happy New Year",
                emoji: "🇧🇹"
            },
            {
                name: "Kazakhstan",
                colors: ["#00AFCA", "#FEC50C"],
                greeting: "Жаңа жылыңызбен (Jaña jılyñızben)",
                emoji: "🇰🇿"
            }
        ]
    },

    // UTC+5.5 (India, Sri Lanka)
    "+5.5": {
        countries: [
            {
                name: "India",
                colors: ["#FF9933", "#FFFFFF", "#128807", "#000080"],
                greeting: "नया साल मुबारक (Naya saal mubarak)",
                emoji: "🇮🇳"
            },
            {
                name: "Sri Lanka",
                colors: ["#8D153A", "#F7B718", "#00534E", "#FFFFFF"],
                greeting: "සුභ අලුත් අවුරුද්දක් (Subha aluth awurudhdhak)",
                emoji: "🇱🇰"
            }
        ]
    },

    // UTC+5 (Pakistan, Uzbekistan, Maldives)
    "+5": {
        countries: [
            {
                name: "Pakistan",
                colors: ["#01411C", "#FFFFFF", "#000000"],
                greeting: "نیا سال مبارک (Naya saal mubarak)",
                emoji: "🇵🇰"
            },
            {
                name: "Uzbekistan",
                colors: ["#0099B5", "#FFFFFF", "#1EB53A", "#CE1126"],
                greeting: "Yangi yil bilan",
                emoji: "🇺🇿"
            },
            {
                name: "Maldives",
                colors: ["#D21034", "#007E3A", "#FFFFFF"],
                greeting: "ކާމިޔާބު އައު އަހަރެއް (Kamiyaabu aa aharu)",
                emoji: "🇲🇻"
            }
        ]
    },

    // UTC+4 (UAE, Oman, Georgia, Armenia, Azerbaijan)
    "+4": {
        countries: [
            {
                name: "United Arab Emirates",
                colors: ["#00732F", "#FFFFFF", "#000000", "#FF0000"],
                greeting: "عام سعيد (Aam saeed)",
                emoji: "🇦🇪"
            },
            {
                name: "Oman",
                colors: ["#FFFFFF", "#DA291C", "#008000"],
                greeting: "عام سعيد (Aam saeed)",
                emoji: "🇴🇲"
            },
            {
                name: "Georgia",
                colors: ["#FF0000", "#FFFFFF"],
                greeting: "გილოცავთ ახალ წელს (Gilotsavt akhal tsels)",
                emoji: "🇬🇪"
            },
            {
                name: "Armenia",
                colors: ["#D90012", "#0033A0", "#F2A800"],
                greeting: "Շնորհավոր Նոր Տարի (Shnorhavor Nor Tari)",
                emoji: "🇦🇲"
            },
            {
                name: "Azerbaijan",
                colors: ["#00B5E2", "#EF3340", "#00AF66"],
                greeting: "Yeni iliniz mübarək",
                emoji: "🇦🇿"
            }
        ]
    },

    // UTC+3 (Saudi Arabia, Qatar, Kuwait, Bahrain, Kenya, Ethiopia, Russia Moscow)
    "+3": {
        countries: [
            {
                name: "Saudi Arabia",
                colors: ["#165B33", "#FFFFFF"],
                greeting: "عام سعيد (Aam saeed)",
                emoji: "🇸🇦"
            },
            {
                name: "Qatar",
                colors: ["#8A1538", "#FFFFFF"],
                greeting: "عام سعيد (Aam saeed)",
                emoji: "🇶🇦"
            },
            {
                name: "Kuwait",
                colors: ["#007A3D", "#FFFFFF", "#CE1126", "#000000"],
                greeting: "عام سعيد (Aam saeed)",
                emoji: "🇰🇼"
            },
            {
                name: "Kenya",
                colors: ["#000000", "#BB0000", "#006600", "#FFFFFF"],
                greeting: "Heri ya mwaka mpya",
                emoji: "🇰🇪"
            },
            {
                name: "Ethiopia",
                colors: ["#078930", "#FCDD09", "#DA121A", "#0F47AF"],
                greeting: "መልካም አዲስ ዓመት (Melkam Addis Amet)",
                emoji: "🇪🇹"
            },
            {
                name: "Russia",
                colors: ["#FFFFFF", "#0039A6", "#D52B1E"],
                greeting: "С Новым Годом (S Novym Godom)",
                emoji: "🇷🇺"
            },
            {
                name: "Turkey",
                colors: ["#E30A17", "#FFFFFF"],
                greeting: "Mutlu Yıllar",
                emoji: "🇹🇷"
            },
            {
                name: "Iraq",
                colors: ["#CE1126", "#FFFFFF", "#007A3D", "#000000"],
                greeting: "سنة جديدة سعيدة (Sana jadida saida)",
                emoji: "🇮🇶"
            },
            {
                name: "Yemen",
                colors: ["#CE1126", "#FFFFFF", "#000000"],
                greeting: "سنة جديدة سعيدة (Sana jadida saida)",
                emoji: "🇾🇪"
            },
            {
                name: "Jordan",
                colors: ["#000000", "#FFFFFF", "#007A3D", "#CE1126"],
                greeting: "سنة سعيدة (Sana saida)",
                emoji: "🇯🇴"
            },
            {
                name: "Lebanon",
                colors: ["#ED1C24", "#FFFFFF"],
                greeting: "سنة سعيدة (Sana saida)",
                emoji: "🇱🇧"
            },
            {
                name: "Syria",
                colors: ["#CE1126", "#FFFFFF", "#000000"],
                greeting: "سنة سعيدة (Sana saida)",
                emoji: "🇸🇾"
            },
            {
                name: "Tanzania",
                colors: ["#1EB53A", "#000000", "#FCD116", "#00A3DD"],
                greeting: "Heri ya mwaka mpya",
                emoji: "🇹🇿"
            },
            {
                name: "Uganda",
                colors: ["#000000", "#FCDC04", "#D90000", "#FFFFFF"],
                greeting: "Happy New Year",
                emoji: "🇺🇬"
            },
            {
                name: "Belarus",
                colors: ["#CE1720", "#00995C", "#FFFFFF"],
                greeting: "З Новым годам (Z Novym hodam)",
                emoji: "🇧🇾"
            },
            {
                name: "Bahrain",
                colors: ["#CE1126", "#FFFFFF"],
                greeting: "عام سعيد (Aam saeed)",
                emoji: "🇧🇭"
            }
        ]
    },

    // UTC+2 (South Africa, Egypt, Israel, Greece, Finland, Romania, Ukraine)
    "+2": {
        countries: [
            {
                name: "South Africa",
                colors: ["#007A4D", "#FFB612", "#000000", "#FFFFFF", "#DE3831", "#002395"],
                greeting: "Happy New Year",
                emoji: "🇿🇦"
            },
            {
                name: "Egypt",
                colors: ["#CE1126", "#FFFFFF", "#000000"],
                greeting: "سنة سعيدة (Sana saida)",
                emoji: "🇪🇬"
            },
            {
                name: "Israel",
                colors: ["#0038B8", "#FFFFFF"],
                greeting: "שנה טובה (Shana tova)",
                emoji: "🇮🇱"
            },
            {
                name: "Greece",
                colors: ["#0D5EAF", "#FFFFFF"],
                greeting: "Καλή Χρονιά (Kalí Chroniá)",
                emoji: "🇬🇷"
            },
            {
                name: "Finland",
                colors: ["#003580", "#FFFFFF"],
                greeting: "Hyvää Uutta Vuotta",
                emoji: "🇫🇮"
            },
            {
                name: "Romania",
                colors: ["#002B7F", "#FCD116", "#CE1126"],
                greeting: "La mulți ani",
                emoji: "🇷🇴"
            },
            {
                name: "Ukraine",
                colors: ["#005BBB", "#FFD500"],
                greeting: "З Новим Роком (Z Novym Rokom)",
                emoji: "🇺🇦"
            },
            {
                name: "Libya",
                colors: ["#E70013", "#000000", "#239E46"],
                greeting: "سنة جديدة سعيدة (Sana jadida saida)",
                emoji: "🇱🇾"
            },
            {
                name: "Sudan",
                colors: ["#D21034", "#FFFFFF", "#000000"],
                greeting: "سنة سعيدة (Sana saida)",
                emoji: "🇸🇩"
            },
            {
                name: "Zimbabwe",
                colors: ["#007A4D", "#FCD116", "#E03C31", "#000000", "#FFFFFF"],
                greeting: "Happy New Year",
                emoji: "🇿🇼"
            },
            {
                name: "Botswana",
                colors: ["#75AADB", "#000000", "#FFFFFF"],
                greeting: "Happy New Year",
                emoji: "🇧🇼"
            },
            {
                name: "Estonia",
                colors: ["#0072CE", "#000000", "#FFFFFF"],
                greeting: "Head uut aastat",
                emoji: "🇪🇪"
            },
            {
                name: "Latvia",
                colors: ["#9E3039", "#FFFFFF"],
                greeting: "Laimīgu Jauno gadu",
                emoji: "🇱🇻"
            },
            {
                name: "Lithuania",
                colors: ["#FDB913", "#006A44", "#C1272D"],
                greeting: "Su Naujaisiais Metais",
                emoji: "🇱🇹"
            },
            {
                name: "Bulgaria",
                colors: ["#FFFFFF", "#00966E", "#D62612"],
                greeting: "Честита Нова Година (Chestita Nova Godina)",
                emoji: "🇧🇬"
            },
            {
                name: "Moldova",
                colors: ["#0046AE", "#FFD100", "#CC092F"],
                greeting: "La mulți ani",
                emoji: "🇲🇩"
            },
            {
                name: "Cyprus",
                colors: ["#FFFFFF", "#D47100", "#4E5B31"],
                greeting: "Καλή Χρονιά (Kalí Chroniá)",
                emoji: "🇨🇾"
            }
        ]
    },

    // UTC+1 (Germany, France, Italy, Spain, Poland, Netherlands, Belgium, Sweden, Norway, Denmark, Austria, Switzerland, Czech Republic, Hungary, Croatia, Serbia, Algeria, Nigeria)
    "+1": {
        countries: [
            {
                name: "Germany",
                colors: ["#000000", "#DD0000", "#FFCE00"],
                greeting: "Frohes Neues Jahr",
                emoji: "🇩🇪"
            },
            {
                name: "France",
                colors: ["#002395", "#FFFFFF", "#ED2939"],
                greeting: "Bonne Année",
                emoji: "🇫🇷"
            },
            {
                name: "Italy",
                colors: ["#009246", "#FFFFFF", "#CE2B37"],
                greeting: "Buon Anno",
                emoji: "🇮🇹"
            },
            {
                name: "Spain",
                colors: ["#C60B1E", "#FFC400"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇪🇸"
            },
            {
                name: "Poland",
                colors: ["#FFFFFF", "#DC143C"],
                greeting: "Szczęśliwego Nowego Roku",
                emoji: "🇵🇱"
            },
            {
                name: "Netherlands",
                colors: ["#AE1C28", "#FFFFFF", "#21468B"],
                greeting: "Gelukkig Nieuwjaar",
                emoji: "🇳🇱"
            },
            {
                name: "Belgium",
                colors: ["#000000", "#FDDA24", "#EF3340"],
                greeting: "Bonne Année",
                emoji: "🇧🇪"
            },
            {
                name: "Sweden",
                colors: ["#006AA7", "#FECC00"],
                greeting: "Gott Nytt År",
                emoji: "🇸🇪"
            },
            {
                name: "Norway",
                colors: ["#BA0C2F", "#FFFFFF", "#00205B"],
                greeting: "Godt Nytt År",
                emoji: "🇳🇴"
            },
            {
                name: "Denmark",
                colors: ["#C8102E", "#FFFFFF"],
                greeting: "Godt Nytår",
                emoji: "🇩🇰"
            },
            {
                name: "Austria",
                colors: ["#ED2939", "#FFFFFF"],
                greeting: "Frohes Neues Jahr",
                emoji: "🇦🇹"
            },
            {
                name: "Switzerland",
                colors: ["#FF0000", "#FFFFFF"],
                greeting: "Bonne Année",
                emoji: "🇨🇭"
            },
            {
                name: "Czech Republic",
                colors: ["#FFFFFF", "#D7141A", "#11457E"],
                greeting: "Šťastný Nový Rok",
                emoji: "🇨🇿"
            },
            {
                name: "Hungary",
                colors: ["#CE2939", "#FFFFFF", "#436F4D"],
                greeting: "Boldog Új Évet",
                emoji: "🇭🇺"
            },
            {
                name: "Croatia",
                colors: ["#FF0000", "#FFFFFF", "#171796"],
                greeting: "Sretna Nova Godina",
                emoji: "🇭🇷"
            },
            {
                name: "Serbia",
                colors: ["#C6363C", "#0C4076", "#FFFFFF"],
                greeting: "Срећна Нова Година (Srećna Nova Godina)",
                emoji: "🇷🇸"
            },
            {
                name: "Algeria",
                colors: ["#006233", "#FFFFFF", "#D21034"],
                greeting: "عام سعيد (Aam saeed)",
                emoji: "🇩🇿"
            },
            {
                name: "Nigeria",
                colors: ["#008751", "#FFFFFF"],
                greeting: "Happy New Year",
                emoji: "🇳🇬"
            },
            {
                name: "Tunisia",
                colors: ["#E70013", "#FFFFFF"],
                greeting: "عام سعيد (Aam saeed)",
                emoji: "🇹🇳"
            },
            {
                name: "Slovakia",
                colors: ["#FFFFFF", "#0B4EA2", "#EE1C25"],
                greeting: "Šťastný Nový Rok",
                emoji: "🇸🇰"
            },
            {
                name: "Slovenia",
                colors: ["#FFFFFF", "#005DA4", "#ED1C24"],
                greeting: "Srečno novo leto",
                emoji: "🇸🇮"
            },
            {
                name: "Bosnia and Herzegovina",
                colors: ["#002395", "#FECB00", "#FFFFFF"],
                greeting: "Sretna Nova Godina",
                emoji: "🇧🇦"
            },
            {
                name: "North Macedonia",
                colors: ["#D20000", "#FFCE00"],
                greeting: "Среќна Нова Година (Srećna Nova Godina)",
                emoji: "🇲🇰"
            },
            {
                name: "Albania",
                colors: ["#E41E20", "#000000"],
                greeting: "Gëzuar Vitin e Ri",
                emoji: "🇦🇱"
            },
            {
                name: "Montenegro",
                colors: ["#C40308", "#D4AF37"],
                greeting: "Srećna Nova Godina",
                emoji: "🇲🇪"
            },
            {
                name: "Kosovo",
                colors: ["#244AA5", "#D0A650", "#FFFFFF"],
                greeting: "Gëzuar Vitin e Ri",
                emoji: "🇽🇰"
            },
            {
                name: "Luxembourg",
                colors: ["#EA141D", "#FFFFFF", "#00A1DE"],
                greeting: "Glécklecht Neies Joer",
                emoji: "🇱🇺"
            },
            {
                name: "Malta",
                colors: ["#FFFFFF", "#CE1126"],
                greeting: "Happy New Year",
                emoji: "🇲🇹"
            },
            {
                name: "Cameroon",
                colors: ["#007A5E", "#CE1126", "#FCD116"],
                greeting: "Bonne Année",
                emoji: "🇨🇲"
            },
            {
                name: "Chad",
                colors: ["#002664", "#FECB00", "#C60C30"],
                greeting: "Bonne Année",
                emoji: "🇹🇩"
            }
        ]
    },

    // UTC+0 (UK, Ireland, Portugal, Ghana, Iceland, Morocco)
    "+0": {
        countries: [
            {
                name: "United Kingdom",
                colors: ["#012169", "#FFFFFF", "#C8102E"],
                greeting: "Happy New Year",
                emoji: "🇬🇧"
            },
            {
                name: "Ireland",
                colors: ["#169B62", "#FFFFFF", "#FF883E"],
                greeting: "Athbhliain faoi mhaise",
                emoji: "🇮🇪"
            },
            {
                name: "Portugal",
                colors: ["#006600", "#FF0000", "#FFE900"],
                greeting: "Feliz Ano Novo",
                emoji: "🇵🇹"
            },
            {
                name: "Ghana",
                colors: ["#CE1126", "#FCD116", "#006B3F", "#000000"],
                greeting: "Happy New Year",
                emoji: "🇬🇭"
            },
            {
                name: "Iceland",
                colors: ["#003897", "#FFFFFF", "#D72828"],
                greeting: "Gleðilegt nýtt ár",
                emoji: "🇮🇸"
            },
            {
                name: "Morocco",
                colors: ["#C1272D", "#006233"],
                greeting: "عام سعيد (Aam saeed)",
                emoji: "🇲🇦"
            }
        ]
    },

    // UTC-1 (Cape Verde, Azores)
    "-1": {
        countries: [
            {
                name: "Cape Verde",
                colors: ["#003893", "#FFFFFF", "#CF2027", "#F7D116"],
                greeting: "Feliz Ano Novo",
                emoji: "🇨🇻"
            }
        ]
    },

    // UTC-2 (South Georgia, South Sandwich Islands)
    "-2": {
        countries: [
            {
                name: "South Georgia",
                colors: ["#012169", "#FFFFFF", "#C8102E"],
                greeting: "Happy New Year",
                emoji: "🇬🇸"
            }
        ]
    },

    // UTC-3 (Brazil, Argentina, Uruguay, Greenland East)
    "-3": {
        countries: [
            {
                name: "Brazil",
                colors: ["#009B3A", "#FEDF00", "#002776", "#FFFFFF"],
                greeting: "Feliz Ano Novo",
                emoji: "🇧🇷"
            },
            {
                name: "Argentina",
                colors: ["#74ACDF", "#FFFFFF", "#F6B40E"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇦🇷"
            },
            {
                name: "Uruguay",
                colors: ["#0038A8", "#FFFFFF", "#FCD116"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇺🇾"
            },
            {
                name: "Greenland",
                colors: ["#FFFFFF", "#D00C27"],
                greeting: "Ukiortaassuaq pilluarit",
                emoji: "🇬🇱"
            }
        ]
    },

    // UTC-4 (Venezuela, Bolivia, Chile, Paraguay)
    "-4": {
        countries: [
            {
                name: "Venezuela",
                colors: ["#FFCC00", "#00247D", "#CF142B"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇻🇪"
            },
            {
                name: "Bolivia",
                colors: ["#D52B1E", "#F9E300", "#007934"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇧🇴"
            },
            {
                name: "Chile",
                colors: ["#0039A6", "#FFFFFF", "#D52B1E"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇨🇱"
            },
            {
                name: "Paraguay",
                colors: ["#D52B1E", "#FFFFFF", "#0038A8"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇵🇾"
            }
        ]
    },

    // UTC-5 (USA East, Canada East, Colombia, Peru, Ecuador, Jamaica, Cuba)
    "-5": {
        countries: [
            {
                name: "United States",
                colors: ["#B22234", "#FFFFFF", "#3C3B6E"],
                greeting: "Happy New Year",
                emoji: "🇺🇸"
            },
            {
                name: "Canada",
                colors: ["#FF0000", "#FFFFFF"],
                greeting: "Happy New Year",
                emoji: "🇨🇦"
            },
            {
                name: "Colombia",
                colors: ["#FCD116", "#003893", "#CE1126"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇨🇴"
            },
            {
                name: "Peru",
                colors: ["#D91023", "#FFFFFF"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇵🇪"
            },
            {
                name: "Ecuador",
                colors: ["#FFD100", "#0072CE", "#EF3340"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇪🇨"
            },
            {
                name: "Jamaica",
                colors: ["#009B3A", "#FED100", "#000000"],
                greeting: "Happy New Year",
                emoji: "🇯🇲"
            },
            {
                name: "Cuba",
                colors: ["#002A8F", "#FFFFFF", "#CB1515"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇨🇺"
            },
            {
                name: "Panama",
                colors: ["#DA121A", "#FFFFFF", "#0033A0"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇵🇦"
            },
            {
                name: "Haiti",
                colors: ["#00209F", "#D21034", "#FFFFFF"],
                greeting: "Bonne Année",
                emoji: "🇭🇹"
            },
            {
                name: "Bahamas",
                colors: ["#00ABC9", "#FFC72C", "#000000"],
                greeting: "Happy New Year",
                emoji: "🇧🇸"
            }
        ]
    },

    // UTC-6 (USA Central, Mexico, Costa Rica, Guatemala, Honduras, El Salvador, Nicaragua)
    "-6": {
        countries: [
            {
                name: "Mexico",
                colors: ["#006847", "#FFFFFF", "#CE1126"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇲🇽"
            },
            {
                name: "Costa Rica",
                colors: ["#002B7F", "#FFFFFF", "#CE1126"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇨🇷"
            },
            {
                name: "Guatemala",
                colors: ["#4997D0", "#FFFFFF"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇬🇹"
            },
            {
                name: "Honduras",
                colors: ["#0073CF", "#FFFFFF"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇭🇳"
            },
            {
                name: "El Salvador",
                colors: ["#0047AB", "#FFFFFF"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇸🇻"
            },
            {
                name: "Nicaragua",
                colors: ["#0067C6", "#FFFFFF"],
                greeting: "Feliz Año Nuevo",
                emoji: "🇳🇮"
            }
        ]
    },

    // UTC-7 (USA Mountain, Belize)
    "-7": {
        countries: [
            {
                name: "United States",
                colors: ["#B22234", "#FFFFFF", "#3C3B6E"],
                greeting: "Happy New Year",
                emoji: "🇺🇸"
            },
            {
                name: "Belize",
                colors: ["#003F87", "#FFFFFF", "#CE1126"],
                greeting: "Happy New Year",
                emoji: "🇧🇿"
            }
        ]
    },

    // UTC-8 (USA West, Canada West)
    "-8": {
        countries: [
            {
                name: "United States",
                colors: ["#B22234", "#FFFFFF", "#3C3B6E"],
                greeting: "Happy New Year",
                emoji: "🇺🇸"
            },
            {
                name: "Canada",
                colors: ["#FF0000", "#FFFFFF"],
                greeting: "Happy New Year",
                emoji: "🇨🇦"
            }
        ]
    },

    // UTC-9 (Alaska)
    "-9": {
        countries: [
            {
                name: "United States",
                colors: ["#B22234", "#FFFFFF", "#3C3B6E"],
                greeting: "Happy New Year",
                emoji: "🇺🇸"
            }
        ]
    },

    // UTC-10 (Hawaii, French Polynesia)
    "-10": {
        countries: [
            {
                name: "United States",
                colors: ["#B22234", "#FFFFFF", "#3C3B6E"],
                greeting: "Hauʻoli Makahiki Hou",
                emoji: "🇺🇸"
            },
            {
                name: "French Polynesia",
                colors: ["#ED2939", "#FFFFFF", "#002395"],
                greeting: "Ia ora na i te matahiti 'api",
                emoji: "🇵🇫"
            }
        ]
    },

    // UTC-11 (American Samoa, Niue)
    "-11": {
        countries: [
            {
                name: "American Samoa",
                colors: ["#002868", "#FFFFFF", "#BF0A30"],
                greeting: "Manuia le Tausaga Fou",
                emoji: "🇦🇸"
            },
            {
                name: "Niue",
                colors: ["#FEDD00", "#012169", "#FFFFFF", "#C8102E"],
                greeting: "Happy New Year",
                emoji: "🇳🇺"
            }
        ]
    },

    // UTC-12 (Baker Island, Howland Island)
    "-12": {
        countries: [
            {
                name: "United States",
                colors: ["#B22234", "#FFFFFF", "#3C3B6E"],
                greeting: "Happy New Year",
                emoji: "🇺🇸"
            }
        ]
    },

    // UTC+12.75 (Chatham Islands, New Zealand)
    "+12.75": {
        countries: [
            {
                name: "New Zealand",
                colors: ["#00247D", "#FFFFFF", "#CC142B"],
                greeting: "Happy New Year",
                emoji: "🇳🇿"
            }
        ]
    },

    // UTC+10.5 (Lord Howe Island, Australia)
    "+10.5": {
        countries: [
            {
                name: "Australia",
                colors: ["#00008B", "#FFFFFF", "#FF0000"],
                greeting: "Happy New Year",
                emoji: "🇦🇺"
            }
        ]
    },

    // UTC+9.5 (Australia Central)
    "+9.5": {
        countries: [
            {
                name: "Australia",
                colors: ["#00008B", "#FFFFFF", "#FF0000"],
                greeting: "Happy New Year",
                emoji: "🇦🇺"
            }
        ]
    },

    // UTC+8.75 (Eucla, Australia)
    "+8.75": {
        countries: [
            {
                name: "Australia",
                colors: ["#00008B", "#FFFFFF", "#FF0000"],
                greeting: "Happy New Year",
                emoji: "🇦🇺"
            }
        ]
    },

    // UTC+5.75 (Nepal)
    "+5.75": {
        countries: [
            {
                name: "Nepal",
                colors: ["#DC143C", "#003893", "#FFFFFF"],
                greeting: "नयाँ वर्षको शुभकामना (Nayā̃ varṣako śubhakāmanā)",
                emoji: "🇳🇵"
            }
        ]
    },

    // UTC+4.5 (Afghanistan)
    "+4.5": {
        countries: [
            {
                name: "Afghanistan",
                colors: ["#000000", "#D32011", "#007A36"],
                greeting: "سال نو مبارک (Sāl-e no mobārak)",
                emoji: "🇦🇫"
            }
        ]
    },

    // UTC+3.5 (Iran)
    "+3.5": {
        countries: [
            {
                name: "Iran",
                colors: ["#239F40", "#FFFFFF", "#DA0000"],
                greeting: "سال نو مبارک (Sāl-e no mobārak)",
                emoji: "🇮🇷"
            }
        ]
    },

    // UTC-3.5 (Newfoundland, Canada)
    "-3.5": {
        countries: [
            {
                name: "Canada",
                colors: ["#FF0000", "#FFFFFF"],
                greeting: "Happy New Year",
                emoji: "🇨🇦"
            }
        ]
    }
};

// Get all unique timezones sorted from earliest to latest
const ALL_TIMEZONES = Object.keys(WORLD_DATA).sort((a, b) => {
    return parseFloat(a) - parseFloat(b);
});

// Export for use in other files
if (typeof window !== 'undefined') {
    window.WORLD_DATA = WORLD_DATA;
    window.ALL_TIMEZONES = ALL_TIMEZONES;
}
