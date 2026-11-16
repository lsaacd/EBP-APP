import json

spanish_raw = """[{"id": "1", "title": "He Aquí Que Tú Eres Hermoso", "lyrics": "He aquí que tú eres hermoso,\\nOh Redentor Jesús, mi bienhechor!\\nTú me impartiste de tu amor,\\nSacando a mi alma del error.\\nMi amado es blanco y rubio,\\nY señalado entre diez mil;\\nY su cabeza cual fino oro,\\nY su esplendor es como el sol.\\n\\nCoro: Cantar de los cantares,\\nCanta su pueblo;\\nEres hermoso, santo Cordero.\\nDentro de mi alma estás\\nMarcado, en mi corazón;\\nTu amor es dulce a mi ser.\\n\\nMi Redentor, El es muy hermoso,\\nY con su amor llena mi corazón;\\nY en los brazos de Jesús\\nToma placer mi corazón\\nComo el pastor toma su oveja\\nAsí Jesús mostró su amor;\\nY ahora exclamó en altavoz:\\n¡Vivo feliz en mi Jesús!\\n\\nYo soy de Cristo y Cristo es mío,\\nEl testimonio Cristo ya lo dio;\\nPorque marcado está en mí ser\\nY yo marcado estoy en El.\\nPuedo decir que yo soy de mi amado,\\nPues ya su sello puso en mí;\\nY si yo vivo es para Cristo,\\nY si yo muero es para El."}, {"id": "2", "title": "Adorar Desde Los Cielos", "lyrics": "Adorad desde los cielos,\\nEn lo alto adorad;\\nÁngeles de luz honradle,\\nOh ejércitos cantad.\\nSol y luna alabadle,\\nAstros todos ensalzad;\\nA Jehová Dios de los Cielos\\nAlabanza en coro dad.\\n\\nCORO: Te adoraremos, ¡Oh buen Salvador!\\nTe alabaremos por tu grande amor;\\nPublicaremos tu gran salvación,\\nRedención santa, es el don de mi Señor.\\n\\nAlabad al Rey de reyes,\\nSus promesas cumplirá;\\nEn su pueblo la victoria\\nSiempre prevalecerá.\\nAlabad al rey de reyes,\\nDios de nuestra salvación;\\nLa Creación cielos y tierra\\nRinda a Dios adoración.\\n\\nGloria, honra y alabanza,\\nTributamos, ¡Oh Señor!\\nGratitud te expresamos,\\nTe rendimos nuestro amor.\\nÁngeles del cielo adoran\\nDe su trono en derredor;\\nOfreciendo alabanza\\nAl gran Nombre del Señor."}, {"id": "3", "title": "En Él Tercer Cielo", "lyrics": "En el tercer cielo cantan miles de almas\\nMiles son las melodías también\\n/:/ Cantan al Cordero en bella armonía,\\nOh que hermoso coro se escucha más\\n allá/:/\\n\\nA través del cielo\\nCielo azul celeste\\nPuedo ahí ya por la fe mirar\\n/:/Multitudes de almas en dulce armonía,\\nPor la fe transporto mi alma más allá/:/\\n\\nSion Ciudad celeste\\nDonde ya no existe,\\nEl dolor y la preocupación,\\n/:/Donde gozaremos también en su gloria,\\nY ese solio santo que miró más allá/:/\\n\\nTodos los cristianos\\nQue en la tierra estamos\\nLlegaremos al celeste hogar\\n/:/Donde viviremos una dicha eterna\\nCuando de este mundo tengamos que partir/:/"}, {"id": "4", "title": "¡Aleluya! ¡Aleluya!", "lyrics": "/:/Aleluya, aleluya, aleluya,\\nAleluya; prez y loor/:/\\n\\nCORO: Prez y loor, aleluya.\\nPrez y loor, aleluya;\\nPrez y loor, aleluya\\nPrez y loor\\n\\n/:/El Cordero que fue inmolado\\nEs digno de prez y loor/:/\\n\\n/:/Al Anciano que está en el Trono\\nDe gloria, prez y loor/:/\\n\\n/:/Al Espíritu Santo que está\\nEntre nosotros, prez y loor/:/\\n\\n/:/Estos tres testimonios\\nConcuerdan en uno:\\nCristo Jesús./:/"}, {"id": "5", "title": "Un Día Veré A Mí Señor", "lyrics": "Un día veré a mi Señor\\nEn la Patria celestial;\\nAllí será mí cantar,\\nSanto, Santo, Santo.\\n\\nCORO: Santo, Santo, Santo,\\nSerá mí cantar;\\nSanto, Santo, Santo,\\nPor toda la eternidad.\\n\\nAllí veré a mi Señor\\nEn la refulgente luz:\\nDiré al Cordero de Dios,\\nSanto, Santo, Santo\\n\\nEstando en mi dulce hogar\\nVeré a Cristo el Redentor;\\nLe diré con gratitud;\\nSanto, Santo, Santo."}, {"id": "6", "title": "Traigo Al Altar Mí Presente", "lyrics": "Traigo al Altar mi presente, \\nPara ofrecérselo al Señor;\\nComo una Ofrenda encendida,\\nPara la Gloria de Dios.\\n\\nCORO: Yo a Dios pagaré mis votos,\\nPorque esta es mi obligación;\\nPorque Él me libra del pecado\\nY de toda tentación.\\n\\nLe ofrezco a Dios mi holocausto,\\nComo David le ofreció;\\nCuando se vio libre y salvo,\\nSus votos a Dios pagó.\\n\\nLe traigo a Dios mi Presente,\\nComo nuestro Padre Abraham;\\nCuando ofreció a su hijo,\\nEn el altar de Jehová.\\n\\nComo una ofrenda encendida,\\nEs bendecir a Jehová\\nPara que Él la reciba\\nDe muy buena Voluntad."}, {"id": "7", "title": "Aleluya Al Cordero", "lyrics": "Loor daremos en las nubes,\\nCanción de júbilo se oirá;\\nLos ángeles en multitudes,\\nTambién alegres cantarán.\\n\\nCORO: Aleluya al Cordero,\\nDiga el universo entero;\\nPor que se oye fuerte resonar,\\nEs la trompeta Celestial.\\nY los muertos en Jesús,\\nDespiertan ya,\\nPara recibir al inmortal.\\n\\n¿Dónde está, oh, muerte, tu aguijón?\\n¿Dónde, oh sepulcro tu victoria?\\nEste será el nuevo son,\\nEn las mansiones de la gloria.\\n\\nVenid, benditos de mi Padre \\nDirá el Príncipe de Paz;\\nVenid a vuestras heredades.\\nA gozar para siempre jamás."}, {"id": "8", "title": "¡Cantad! ¡Cantad!", "lyrics": "Cantad, cantad con el entendimiento,\\nY tributad loores al Rey;\\nLoores daremos, a quien debemos\\nLa libertad.\\n\\nCORO: Así marcharemos pues a Sión.\\nCiudad de Dios, que es la Capital;\\nAl frente va Jesús el Rey,\\nCaudillo y General\\nDe esta iglesia, que es Espiritual.\\n\\nLoores dad con entendimiento,\\nY bendecid a Cristo Jesús;\\nAsí cantaremos\\nA quien debemos, la libertad.\\n\\nLoad, load al manso Cordero,\\nEs quien da gozo, paz y consuelo;\\nTodos los lavados\\nA Cristo damos prez y loor\\n\\nLos bautizados en Cristo Jesús,\\nEsos se gozan andando en su luz;\\nLuz que resplandece,\\nY esa Luz, es Cristo Jesús."}, {"id": "9", "title": "Cantad De Los Cantares", "lyrics": "Quien es esta que se muestra como el alba,\\nHermosa como la luna,\\nEsclarecida como el sol,\\nImponente como ejércitos en orden,\\nEsta mujer es. . .\\nLa iglesia de Dios.\\n\\nCORO: /:/Cantar/:/ Cantar de los cantares,\\n/:/Canción/:/ Canciones celestiales,\\n/:/Cantad/:/ Cantemos los mortales,\\nDe la iglesia del Dios Vivo,\\nEl Buen Pastor.\\n\\nQuien es esta que se eleva en el desierto,\\nComo columnita de humo,\\nComo panal de rica miel,\\nCon Sahumerios de mirra y de incienso\\nEsta mujer es. . .\\nLa iglesia de Dios\\n\\nTus renuevos paraíso de granados,\\nDe cámporas de nardos,\\nY de hermosura sin igual,\\nEs la iglesia que le canta al Dios Vivo,\\nColumna y Apoyo de la Verdad."}, {"id": "10", "title": "Al Hacer Jesús Su Entrada Triunfal", "lyrics": "Al hacer Jesús en Jerusalén\\nSu entrada triunfal;\\nA su amada grey dio la libertad\\nEn humilde pollino\\nCabalgaba el Rey;\\nCon esto nos dijo que vano es\\nEl lujo, y la pompa es vanidad.\\n\\nCORO: Hosanna, cantaba al hijo de David,\\n¡Bendito el que viene\\nEn Nombre del Señor!\\nGloria en las alturas,\\nCantaban a una voz,\\nY gloria cantamos\\nTambién nosotros hoy.\\n\\n¡Oh, hija de Sion!\\nTu Rey viene aquí;\\nEl cordero Pascual,\\nToma posesión de su Reino aquí.\\nDe siglos es Rey el deseado es;\\nImplantó la ley de  la libertad\\nSuave yugo es.\\n\\nSe oyó fuerte voz de dulce\\nCantar, de las multitudes\\nQue venían con el\\nSu canto es igual.\\nY de los pequeños\\nComo escrito esta,\\nTendrían que salir,\\nGlorias y alabanzas,\\nAl Padre Celes al."}, {"id": "11", "title": "Anhelo En Las Regias Mansiones…", "lyrics": "Anhelo en las regias mansiones morar\\nDo reina mi salvador;\\nEscucho los ecos de un dulce cantar de triunfo, de gran loor.\\n\\nCORO: A mi supremo Rey, alegre cantare;\\nMis ojos han de ver la playa celestial;\\nFeliz y libre soy y caminando voy\\nCon júbilo a mi eterno hogar.\\n\\nPor senda escarpada, quizá habré de andar\\nEl mundo me olvidará;\\nMás en la ribera del límpido mar\\nLos santos me esperan ya.\\n\\nGloriosa esperanza, inefable paz\\nQue siente mi corazón;\\n¡Qué dulce es tener comunión y solaz!\\nCon Dios en adoración.\\n\\nEleva tu vista y contempla a Jesús\\nSe fiel a tu Rey, Señor;\\nLos ní dos rayos que nimban la cruz\\nTe envuelven en su esplendor."}, {"id": "12", "title": "Hoy Es Tiempo De Alabar Al Señor", "lyrics": "Hoy es el tiempo\\nDe alabar al Señor;\\nEs el tiempo de darle loor;\\nTodos con alegría\\nTributadle honor y loor.\\n\\nAleluya, al Gran Rey Jehová,\\nAleluya por su gran bondad;\\nBendito el Rey Emmanuel.\\nGloria a Él;\\nAleluya, cantadle a Él.\\n\\nEs el tiempo\\nDe adorar al Gran Dios,\\nY el tiempo cumplido ya es;\\nEn que todos los santos\\nHan de darle loor al Señor.\\n\\nHoy es día en que todos aquí,\\nNuestro gozo cumplido ya es;\\nContemplando la gloria\\nDel Espíritu Santo de Dios.\\n\\nAleluya, aleluya al Señor,\\nAleluya, aleluya, Amén;\\nAleluya, aleluya;\\nAleluya al Cordero de Dios."}, {"id": "13", "title": "Los Ángeles Alaban Al Señor", "lyrics": "Los ángeles del cielo \\nAlaban al Señor;\\nTambién los querubines\\nLe dan loor. ¡Qué hermoso será!\\nEstar allá en plenitud,\\nJunto a mi Señor,\\nY disfrutar de su bella luz;\\nEn seguridad eternal.\\n\\nCORO: Vamos caminando,\\nSí, vamos marchando;\\nPara llegar allá con Él,\\nNadie se detenga, siga su carrera\\nQue el premio santo\\nEn Cristo está.\\n\\nLas aves cada día,\\nBendicen al Creador;\\nCon cantos de alegría\\nY gratitud. ¡Qué felicidad!\\nEl disfrutar de su bondad,\\nCon su gran amor;\\nQue ha derramado en el corazón \\nPara adorarle en verdad.\\n\\nSu pueblo aquí en la tierra,\\nLe rinde adoración;\\nPorque ha participado,\\nDe su perdón.\\nEl Señor Jesús lo redimió\\nCon su poder, diole santidad,\\nPara que fuera pueblo de Él,\\nPor toda la eternidad."}, {"id": "14", "title": "Loores Dad A Emmanuel", "lyrics": "Loores dad a Emmanuel\\nQue declarado es Dios;\\nLoadle todos con amor,\\nAl que redimió a Israel.\\n\\nCORO:\\nLoor. . . Al santo Emmanuel,\\nLoor. . . Al que salvó y redimió;\\nPrez y loor. . . Aleluya, Amen,\\nAleluya al Rey de Sión.\\n\\nLoores dad a Cristo el Rey,\\nCordero santo fiel;\\nTodos postrados adorad,\\nAl que redimió a Israel.\\n\\nLoores dad al que venció,\\nAl fiero tentador;\\nPues con su brazo de poder,\\nÉl redimió a Israel.\\n\\nA Jesucristo nuestro Rey,\\nLoor. . . loor. . .loor;\\nQue muestra hoy su gran poder,\\nLoor; prez y loor."}, {"id": "15", "title": "Todos Canten Al Señor", "lyrics": "Todos canten al Señor,\\nReconoced su favor;\\nTodos en fiel comunión,\\nBendecid al Alto Dios.\\n\\nCORO:  Cantad, cantad sí cantad. . .\\nCantad, cantad a Jesús;\\nQue su inefable bondad,\\nFue derramada en la cruz.\\n\\nDeja ya tu mal hacer.\\nY sírvele a tu Creador;\\nVen humíllate ante El,\\nY alcanzarás bendición.\\n\\nGloria al Hijo de David,\\nDecía grande multitud;\\nGloria cantemos aquí,\\nPues nos ha dado salud.\\n\\nCante la Congregación,\\nA Cristo mi Salvador;\\nEl nos dará bendición,\\nY heredad, en su mansión."}, {"id": "16", "title": "Gozo Que Está Iglesia Tiene Hoy", "lyrics": "El gozo que esta iglesia\\nTiene hoy. . .  Es del Rey,\\nEl Santo de Israel.\\nPorque ya pronto viene Él con poder\\n/:/A levantar su grey/:/\\n\\nCORO: Digno eres, Cordero de Dios;\\nDe tomar la potestad;\\nHonor y honra mi alma te dará.\\n\\nClamad en alta voz diciendo\\nAsí. . .    ¡Salvación!\\nAl Rey de la Creación,\\nTodos los que le teméis load,\\n. . .¡A Jesús!\\n/:/Al Santo de Israel/:/\\n\\nCon gozo alabad a Emmanuel,\\n. . .¡Gloria a Él!\\nPorque Él nos libertó,\\nMuriendo así en una cruz,\\n. . .¡Con amor!\\n/:/Por darnos el poder/:/\\n\\nGocemos todos en la comunión,\\n. . . ¡De Jesús!\\nCantando a una voz,\\n¡Hosanna al Hijo de David!\\n. . . ¡Nuestro Rey!\\n/:/Bendito el Redentor/:/"}, {"id": "17", "title": "¡Gloria! ¡Gloria!", "lyrics": "Y con su sangre\\nNuestras culpas Él borró;\\nY nuestras almas \\nPara siempre redimió.\\nÉl nos salvó y redimió,\\nY vida eterna para siempre\\nÉl ofreció.\\n\\nCORO:\\nGloria, gloria, gloria;\\nAl Cordero de Dios.\\n/:/Gloria al Cordero\\nQue murió por nuestro bien/:/\\nGloria, gloria, gloria;\\nAl Cordero de Dios.\\n\\nY Jesús dice a todo aquel \\nQue viene a mí,\\nIrá a gozar de las moradas\\nCelestiales, para vivir,\\nPara reinar, para gozar,\\nCon el Divino Salvador.\\n\\nÉl es la fuente\\nInagotable de salud,\\nQue al alma limpia\\nCon su sangre derramada;\\nPara tener la salvación,\\nQue me ofreció\\nMi Salvador Cristo Jesús."}, {"id": "18", "title": "Loores Dad A Cristo", "lyrics": "Loores dad a Cristo el Rey,\\nExcelso y Soberano;\\nY Proclamad su amor y ley\\nA todo ser humano;\\nVibrantes notas arrancad,\\nDe vuestras almas entonad;\\nEn dulce acento celestial,\\nLoor, loor, loor a Cristo el Rey\\n\\nCORO: \\n/:/Prez y gloria a Cristo el Rey/:/\\nGloria alabanzas y majestad,\\nOmnipotencia y benignidad,\\nAl eterno Rey.\\n/:/Prez y gloria a Cristo el Rey/:/\\nRey de reyes inmortal\\nLoor a Cristo el Rey.\\n\\nLoores dad a Cristo el Rey,\\nEn férvidas canciones;\\nEl regirá de mar a mar\\nDel mundo a las naciones,\\nY de su trono en derredor\\nAlegres almas con amor,\\nEn son triunfante entonaran.\\nLoor, loor, loor, loor;\\nA Cristo el Rey.\\n\\nLoores dad a Cristo el Rey,\\nSeñor resucitado;\\nQue al enemigo fuerte y cruel\\nTriunfante ha derrotado,\\nY las legiones de Satán,\\nVenciólas nuestro Capitán,\\nCanten los cielos, tierra y mar;\\nLoor, loor, loor, loor;\\nA Cristo el Rey."}, {"id": "19", "title": "¡Hosanna! Rey De La Gloria", "lyrics": "Hosanna Rey de la Gloria,\\nTu grandeza no cabe en tu gloria;\\nNi en los cielos, ni en los mares\\nNi en la tierra, ni en tu gloria.\\n\\nCORO: \\nHosanna Rey de la gloria,\\nEres la lluvia temprana;\\nEres tu nuestra alegría,\\nHosanna,  hosanna,  hosanna.\\n\\nHosanna Rey de la gloria,\\nLos ángeles a  te claman;\\nLas ondas y los mares,\\nTe dicen hosanna, hosanna.\\n\\nHosanna Rey de la gloria,\\nEres astro de la mañana,\\nEres rocío, eres luz de día,\\nEres la lluvia temprana.\\n\\nHosanna Rey de la gloria,\\nLas flores a  embalsaman:\\nY las aves a  te alaban,\\nTe dicen hosanna, hosanna."}, {"id": "20", "title": "Bendito Sea Él Rey De Reyes", "lyrics": "Bendito sea el Rey de reyes,\\nQue con su brazo fuerte\\nNos libró.\\nBendito sea su santo nombre,\\nPorque Él nos dio\\nGrande protección.\\nGloria a Jesucristo, porque\\nÉl es digno de adoración.\\n\\nCORO: \\nGloria a Cristo mi Rey,\\nGloria a mi gran Rey;\\nAleluya, cantemos a Él,\\nPor su gran poder.\\n\\nGrande alegría y contentamiento\\nHay en la iglesia Santa\\nDel Señor.\\nPor ver cumplido hasta este día\\nEstar unidos todos en reunión;\\nTodos alabando;\\nA Jesucristo el Rey de Sión.\\n\\nIglesia Santa del fiel Cordero\\nHoy es el día de adorar a Dios,\\nPor las victorias y las proezas\\nQue ha derramado\\nCristo el Salvador.\\nGloria a Jesucristo,\\nEl cual derrama su bendición.\\n\\nA Jesucristo el Rey de reyes,\\nQue está sentado en su majestad;\\nSea su Nombre glorificado,\\nPorque ha vencido\\nAl fiero tentador; por su poderío\\nEl cual domina sobre el dragón."}]"""

translations = [
    {
        "id": "1",
        "title": "Behold, Thou Art Fair",
        "lyrics": (
            "Behold, Thou art fair,\n"
            "O Redeemer Jesus, my Benefactor!\n"
            "Thou didst impart unto me Thy love,\n"
            "Drawing my soul out from error.\n"
            "My beloved is white and ruddy,\n"
            "And chiefest among ten thousand;\n"
            "And His head is as the finest gold,\n"
            "And His splendor is like the sun.\n\n"
            "Chorus: Song of songs,\n"
            "His people sing;\n"
            "Thou art fair, O holy Lamb.\n"
            "Within my soul Thou art\n"
            "Imprinted, upon my heart;\n"
            "Thy love is sweet unto my soul.\n\n"
            "My Redeemer, He is most fair,\n"
            "And with His love He fills my heart;\n"
            "And in the arms of Jesus\n"
            "My heart doth take delight;\n"
            "Even as the shepherd takes his sheep,\n"
            "So Jesus hath shown His love;\n"
            "And now I cry with a loud voice:\n"
            "I live rejoicing in my Jesus!\n\n"
            "I am Christ's, and Christ is mine,\n"
            "The witness Christ hath given;\n"
            "For He is imprinted in my being,\n"
            "And I am marked in Him.\n"
            "I can say that I am my beloved's,\n"
            "For He hath set His seal upon me;\n"
            "And if I live, it is for Christ,\n"
            "And if I die, it is for Him."
        )
    },
    {
        "id": "2",
        "title": "Worship from the Heavens",
        "lyrics": (
            "Worship Him from the heavens,\n"
            "In the heights above, adore;\n"
            "Angels of light, give Him honor,\n"
            "O ye heavenly hosts, sing forth.\n"
            "Sun and moon, give praise unto Him,\n"
            "All ye shining stars, exalt;\n"
            "Unto the Lord God of the Heavens\n"
            "Give ye praise in choral hymn.\n\n"
            "CHORUS: We will adore Thee, O good Savior!\n"
            "We will praise Thee for Thy great love;\n"
            "We will proclaim Thy great salvation,\n"
            "Holy redemption, 'tis the gift of my Lord.\n\n"
            "Praise ye the King of kings,\n"
            "His promises He will fulfill;\n"
            "Unto His people victory\n"
            "Shall forevermore prevail.\n"
            "Praise ye the King of kings,\n"
            "God of our salvation;\n"
            "Let Creation, heavens and earth,\n"
            "Render worship unto God.\n\n"
            "Glory, honor, and high praise,\n"
            "We render unto Thee, O Lord!\n"
            "Gratitude we express to Thee,\n"
            "We surrender unto Thee our love.\n"
            "Angels of heaven adore Him\n"
            "Round about His holy throne;\n"
            "Offering up songs of praise\n"
            "To the great Name of the Lord."
        )
    },
    {
        "id": "3",
        "title": "In the Third Heaven",
        "lyrics": (
            "In the third heaven sing thousands of souls,\n"
            "Thousands are the melodies also;\n"
            "/:/ They sing to the Lamb in sweet harmony,\n"
            "Oh, what a glorious choir is heard up\n"
            " yonder/:/\n\n"
            "Through the boundless heaven,\n"
            "Sky of celestial blue,\n"
            "There already by faith I behold:\n"
            "/:/Multitudes of souls in sweet harmony,\n"
            "By faith I bear my soul to that realm beyond/:/\n\n"
            "Zion, city celestial,\n"
            "Where no longer existeth\n"
            "Any sorrow, neither grief nor care,\n"
            "/:/Where we shall rejoice likewise in His glory,\n"
            "And that holy throne which I see beyond/:/\n\n"
            "All we faithful Christians\n"
            "Who dwell on the earth below\n"
            "Shall arrive at our heavenly home,\n"
            "/:/Where we shall live in eternal felicity\n"
            "When from this earthly world we depart at last/:/"
        )
    },
    {
        "id": "4",
        "title": "Hallelujah! Hallelujah!",
        "lyrics": (
            "/:/Hallelujah, hallelujah, hallelujah,\n"
            "Hallelujah; praise and laud/:/\n\n"
            "CHORUS: Praise and laud, hallelujah.\n"
            "Praise and laud, hallelujah;\n"
            "Praise and laud, hallelujah,\n"
            "Praise and laud\n\n"
            "/:/The Lamb that was slain\n"
            "Is worthy of praise and laud/:/\n\n"
            "/:/Unto the Ancient of Days on the Throne\n"
            "Of glory, be praise and laud/:/\n\n"
            "/:/Unto the Holy Spirit who is\n"
            "Among us, be praise and laud/:/\n\n"
            "/:/These three witnesses\n"
            "Agree in one:\n"
            "Christ Jesus./:/"
        )
    },
    {
        "id": "5",
        "title": "One Day I Shall See My Lord",
        "lyrics": (
            "One day I shall see my Lord\n"
            "In the heavenly Homeland fair;\n"
            "There shall ever be my song:\n"
            "Holy, Holy, Holy.\n\n"
            "CHORUS: Holy, Holy, Holy,\n"
            "Shall my singing be;\n"
            "Holy, Holy, Holy,\n"
            "Throughout all eternity.\n\n"
            "There I shall behold my Lord\n"
            "In the bright, refulgent light;\n"
            "I shall say to the Lamb of God:\n"
            "Holy, Holy, Holy\n\n"
            "Dwelling in my sweet home above,\n"
            "I shall see Christ the Redeemer;\n"
            "I will say to Him with gratitude:\n"
            "Holy, Holy, Holy."
        )
    },
    {
        "id": "6",
        "title": "I Bring My Offering to the Altar",
        "lyrics": (
            "I bring my gift to the Altar,\n"
            "To offer it unto the Lord;\n"
            "Even as an offering made by fire,\n"
            "Unto the glory of God.\n\n"
            "CHORUS: I will pay my vows unto God,\n"
            "For this is my bounden duty;\n"
            "Because He delivers me from sin\n"
            "And from every temptation.\n\n"
            "I offer to God my burnt offering,\n"
            "Even as David offered to Him;\n"
            "When he saw himself delivered and saved,\n"
            "His vows unto God he paid.\n\n"
            "I bring unto God my offering,\n"
            "Even as our father Abraham,\n"
            "When he offered up his son\n"
            "Upon the altar of the Lord.\n\n"
            "Even as an offering made by fire,\n"
            "Is the blessing of the Lord,\n"
            "That He may receive it\n"
            "With gracious goodwill."
        )
    },
    {
        "id": "7",
        "title": "Hallelujah to the Lamb",
        "lyrics": (
            "Praise we shall give in the clouds above,\n"
            "A song of rejoicing shall be heard;\n"
            "The angels in their multitudes,\n"
            "Likewise with gladness shall sing.\n\n"
            "CHORUS: Hallelujah to the Lamb,\n"
            "Let the whole creation say;\n"
            "For it is heard resounding loud,\n"
            "'Tis the heavenly trumpet sound.\n"
            "And the dead in Jesus Christ,\n"
            "Awaken now,\n"
            "To receive the Immortal One.\n\n"
            "Where, O death, is now thy sting?\n"
            "Where, O grave, is thy victory?\n"
            "This shall be the glorious strain,\n"
            "In the mansions of glory on high.\n\n"
            "Come, ye blessed of my Father,\n"
            "The Prince of Peace shall say;\n"
            "Come unto your inheritance,\n"
            "To rejoice forever and evermore."
        )
    },
    {
        "id": "8",
        "title": "Sing Ye! Sing Ye!",
        "lyrics": (
            "Sing ye, sing ye with understanding,\n"
            "And render praises to the King;\n"
            "Praises we give to Him to whom we owe\n"
            "Our liberty.\n\n"
            "CHORUS: Thus we shall march onward to Zion,\n"
            "City of God, which is the Capital;\n"
            "At the head goes Jesus the King,\n"
            "Captain and General\n"
            "Of this church, which is Spiritual.\n\n"
            "Give ye praises with understanding,\n"
            "And bless the Name of Christ Jesus;\n"
            "Thus we shall sing\n"
            "To Him to whom we owe our liberty.\n\n"
            "Praise ye, praise the gentle Lamb,\n"
            "'Tis He who giveth joy, peace, and comfort;\n"
            "All ye who are washed,\n"
            "Unto Christ we give praise and laud\n\n"
            "They that are baptized into Christ Jesus,\n"
            "They rejoice walking in His light;\n"
            "Light that shineth forth,\n"
            "And that Light is Christ Jesus."
        )
    },
    {
        "id": "9",
        "title": "Song of Songs",
        "lyrics": (
            "Who is she that looketh forth as the morning,\n"
            "Fair as the moon,\n"
            "Clear as the sun,\n"
            "Majestic as an army with banners?\n"
            "This woman is. . .\n"
            "The Church of God.\n\n"
            "CHORUS: /:/Song/:/ Song of songs,\n"
            "/:/Song/:/ Songs celestial,\n"
            "/:/Sing ye/:/ Let us mortals sing,\n"
            "Of the Church of the Living God,\n"
            "The Good Shepherd.\n\n"
            "Who is she that riseth up from the wilderness,\n"
            "Like a pillar of smoke,\n"
            "Like a honeycomb of sweet honey,\n"
            "Perfumed with myrrh and frankincense\n"
            "This woman is. . .\n"
            "The Church of God\n\n"
            "Thy plants are an orchard of pomegranates,\n"
            "With pleasant camphire and spikenard,\n"
            "And of beauty without peer;\n"
            "'Tis the Church that singeth to the Living God,\n"
            "Pillar and Ground of the Truth."
        )
    },
    {
        "id": "10",
        "title": "When Jesus Made His Triumphal Entry",
        "lyrics": (
            "When Jesus made into Jerusalem\n"
            "His triumphal entry;\n"
            "To His beloved flock He gave liberty;\n"
            "Upon a humble colt\n"
            "Rode the King;\n"
            "Thereby He showed us how vain is\n"
            "Luxury, and pomp is vanity.\n\n"
            "CHORUS: Hosanna, they sang to the Son of David,\n"
            "Blessed is He that cometh\n"
            "In the Name of the Lord!\n"
            "Glory in the highest,\n"
            "They sang with one accord,\n"
            "And glory we sing\n"
            "Likewise this day.\n\n"
            "O daughter of Zion!\n"
            "Thy King cometh here;\n"
            "The Paschal Lamb,\n"
            "Taketh possession of His Kingdom here.\n"
            "King of the ages, the Desired of nations;\n"
            "He established the law of liberty,\n"
            "His yoke is easy.\n\n"
            "A loud voice was heard of sweet\n"
            "Singing, from the multitudes\n"
            "That came with Him,\n"
            "Their song was as one.\n"
            "And from the little ones,\n"
            "As it is written,\n"
            "There must needs go forth,\n"
            "Glory and high praises,\n"
            "Unto the Father Celestial."
        )
    },
    {
        "id": "11",
        "title": "I Long in Royal Mansions to Dwell…",
        "lyrics": (
            "I long in royal mansions to dwell,\n"
            "Where my Savior reigns;\n"
            "I hear the echoes of a sweet song of triumph, of glorious praise.\n\n"
            "CHORUS: Unto my supreme King, joyfully I will sing;\n"
            "Mine eyes shall behold the celestial shore;\n"
            "Happy and free am I, and onward I go\n"
            "With gladness to my eternal home.\n\n"
            "Along rugged paths perchance I must walk,\n"
            "The world shall forget me here;\n"
            "Yet on the shores of the crystal-clear sea\n"
            "The saints await me now.\n\n"
            "Glorious hope, ineffable peace,\n"
            "Which my heart doth feel;\n"
            "How sweet to have fellowship and delight\n"
            "With God in adoration!\n\n"
            "Lift up thine eyes and behold Jesus,\n"
            "Be faithful to thy King and Lord;\n"
            "The radiant beams that encircle the cross\n"
            "Enfold thee in their splendor."
        )
    },
    {
        "id": "12",
        "title": "Now Is the Time to Praise the Lord",
        "lyrics": (
            "Now is the time\n"
            "To praise the Lord;\n"
            "'Tis the time to give Him laud;\n"
            "All ye with joyfulness\n"
            "Render Him honor and praise.\n\n"
            "Hallelujah to the Great King, the Lord,\n"
            "Hallelujah for His great goodness;\n"
            "Blessed be Emmanuel the King,\n"
            "Glory to Him;\n"
            "Hallelujah, sing praises to Him.\n\n"
            "Now is the time\n"
            "To worship the Great God,\n"
            "And the time is now fulfilled;\n"
            "Wherein all the saints\n"
            "Shall give praise unto the Lord.\n\n"
            "Today is the day when to all of us here\n"
            "Our joy is fully fulfilled,\n"
            "Contemplating the glory\n"
            "Of the Holy Spirit of God.\n\n"
            "Hallelujah, hallelujah to the Lord,\n"
            "Hallelujah, hallelujah, Amen;\n"
            "Hallelujah, hallelujah;\n"
            "Hallelujah to the Lamb of God."
        )
    },
    {
        "id": "13",
        "title": "The Angels Praise the Lord",
        "lyrics": (
            "The angels of heaven\n"
            "Praise the Lord;\n"
            "The cherubim likewise\n"
            "Give Him laud. Oh, how glorious 'twill be\n"
            "To be yonder in fullness of joy,\n"
            "Beside my Lord,\n"
            "And to delight in His beautiful light,\n"
            "In eternal security!\n\n"
            "CHORUS: Onward we are walking,\n"
            "Yea, onward we march,\n"
            "To arrive yonder with Him;\n"
            "Let no one tarry, run on in your race,\n"
            "For the holy prize\n"
            "In Christ is found.\n\n"
            "The birds of the air each day\n"
            "Bless the Creator;\n"
            "With songs of joyfulness\n"
            "And gratitude. What happiness,\n"
            "To taste of His goodness,\n"
            "With His great love,\n"
            "Which He hath poured into the heart\n"
            "To worship Him in truth!\n\n"
            "His people here on earth\n"
            "Render Him adoration;\n"
            "Because they have partaken\n"
            "Of His forgiveness.\n"
            "The Lord Jesus redeemed them\n"
            "By His power, granted them holiness,\n"
            "That they might be a people for His own,\n"
            "Through all eternity."
        )
    },
    {
        "id": "14",
        "title": "Give Praises unto Emmanuel",
        "lyrics": (
            "Give praises unto Emmanuel,\n"
            "Who is declared to be God;\n"
            "Praise Him, all ye, with love,\n"
            "He who redeemed Israel.\n\n"
            "CHORUS:\n"
            "Praise. . . unto holy Emmanuel,\n"
            "Praise. . . unto Him who saved and redeemed;\n"
            "Praise and laud. . . Hallelujah, Amen,\n"
            "Hallelujah to the King of Zion.\n\n"
            "Give praises unto Christ the King,\n"
            "Holy and faithful Lamb;\n"
            "All ye prostrate, adore Him,\n"
            "He who redeemed Israel.\n\n"
            "Give praises to Him who overcame\n"
            "The fierce tempter;\n"
            "For with His arm of power,\n"
            "He redeemed Israel.\n\n"
            "Unto Jesus Christ our King,\n"
            "Praise. . . praise. . . praise;\n"
            "Who showeth forth His great power today,\n"
            "Praise; laud and praise."
        )
    },
    {
        "id": "15",
        "title": "Let All Sing unto the Lord",
        "lyrics": (
            "Let All Sing unto the Lord,\n"
            "Acknowledge His favor;\n"
            "All in faithful communion,\n"
            "Bless the Most High God.\n\n"
            "CHORUS:  Sing, sing, yea, sing. . .\n"
            "Sing, sing unto Jesus;\n"
            "For His ineffable goodness,\n"
            "Was poured out on the cross.\n\n"
            "Cease now from thine evil doing,\n"
            "And serve thy Creator;\n"
            "Come, humble thyself before Him,\n"
            "And thou shalt obtain blessing.\n\n"
            "Glory to the Son of David,\n"
            "Cried the great multitude;\n"
            "Glory let us sing here below,\n"
            "For He hath given us salvation.\n\n"
            "Let the congregation sing\n"
            "Unto Christ my Savior;\n"
            "He will grant us blessing,\n"
            "And an inheritance in His mansion."
        )
    },
    {
        "id": "16",
        "title": "The Joy This Church Hath Today",
        "lyrics": (
            "The joy that this church\n"
            "Hath today. . .  Is of the King,\n"
            "The Holy One of Israel.\n"
            "For soon He cometh with power\n"
            "/:/To gather His flock/:/\n\n"
            "CHORUS: Worthy art Thou, Lamb of God;\n"
            "To receive the power;\n"
            "Honor and glory my soul shall give Thee.\n\n"
            "Cry out with a loud voice, saying\n"
            "Thus. . .    Salvation!\n"
            "Unto the King of Creation,\n"
            "All ye that fear Him, praise,\n"
            ". . .Jesus!\n"
            "/:/The Holy One of Israel/:/\n\n"
            "With joy give praise to Emmanuel,\n"
            ". . .Glory to Him!\n"
            "For He hath set us free,\n"
            "Dying thus upon a cross,\n"
            ". . .In love!\n"
            "/:/To grant us power/:/\n\n"
            "Let us all rejoice in the communion,\n"
            ". . . Of Jesus!\n"
            "Singing with one voice,\n"
            "Hosanna to the Son of David!\n"
            ". . . Our King!\n"
            "/:/Blessed be the Redeemer/:/"
        )
    },
    {
        "id": "17",
        "title": "Glory! Glory!",
        "lyrics": (
            "And with His blood\n"
            "He washed away our guilt;\n"
            "And our souls\n"
            "He redeemed forevermore.\n"
            "He saved and redeemed us,\n"
            "And life eternal forever\n"
            "He freely offered.\n\n"
            "CHORUS:\n"
            "Glory, glory, glory;\n"
            "Unto the Lamb of God.\n"
            "/:/Glory to the Lamb\n"
            "Who died for our salvation/:/\n"
            "Glory, glory, glory;\n"
            "Unto the Lamb of God.\n\n"
            "And Jesus saith to everyone\n"
            "Who cometh unto Me,\n"
            "He shall go to enjoy the mansions\n"
            "Celestial, there to live,\n"
            "To reign, and to rejoice,\n"
            "With the Divine Savior.\n\n"
            "He is the fountain\n"
            "Inexhaustible of salvation,\n"
            "Cleansing the soul\n"
            "With His blood out-poured;\n"
            "That we might have the salvation,\n"
            "Offered to me\n"
            "By my Savior, Christ Jesus."
        )
    },
    {
        "id": "18",
        "title": "Give Praises unto Christ",
        "lyrics": (
            "Give praises unto Christ the King,\n"
            "Exalted and Sovereign Lord;\n"
            "And proclaim His love and law\n"
            "To every human being;\n"
            "Strike vibrant notes of melody,\n"
            "Tune every soul to sing;\n"
            "In sweet celestial harmony,\n"
            "Praise, praise, praise to Christ the King\n\n"
            "CHORUS: \n"
            "/:/Praise and glory to Christ the King/:/\n"
            "Glory, praises, and majesty,\n"
            "Omnipotence and lovingkindness,\n"
            "To the eternal King.\n"
            "/:/Praise and glory to Christ the King/:/\n"
            "King of kings, immortal Lord\n"
            "Praise to Christ the King.\n\n"
            "Give praises unto Christ the King,\n"
            "In fervent songs of joy;\n"
            "He shall have dominion from sea to sea\n"
            "Over the nations of the world,\n"
            "And round about His glorious throne\n"
            "Glad souls with fervent love,\n"
            "In triumphant strains shall sing.\n"
            "Praise, praise, praise, praise;\n"
            "Unto Christ the King.\n\n"
            "Give praises unto Christ the King,\n"
            "The risen, living Lord;\n"
            "Who the strong and cruel foe\n"
            "Hath vanquished in triumph,\n"
            "And all the legions of Satan,\n"
            "Our Captain hath overcome,\n"
            "Let heaven, earth, and sea resound;\n"
            "Praise, praise, praise, praise;\n"
            "Unto Christ the King."
        )
    },
    {
        "id": "19",
        "title": "Hosanna! King of Glory",
        "lyrics": (
            "Hosanna, King of Glory,\n"
            "Thy greatness cannot be contained within Thy glory;\n"
            "Neither in the heavens, nor in the seas\n"
            "Nor on earth, nor in Thy glory.\n\n"
            "CHORUS: \n"
            "Hosanna, King of Glory,\n"
            "Thou art the early rain;\n"
            "Thou art our joyful singing,\n"
            "Hosanna,  hosanna,  hosanna.\n\n"
            "Hosanna, King of Glory,\n"
            "Unto Thee the angels cry;\n"
            "The waves and the mighty seas,\n"
            "Declare unto Thee: Hosanna, hosanna.\n\n"
            "Hosanna, King of Glory,\n"
            "Thou art the Bright Morning Star,\n"
            "Thou art the dew, Thou art light of day,\n"
            "Thou art the early rain.\n\n"
            "Hosanna, King of Glory,\n"
            "The flowers yield their sweet perfume unto Thee:\n"
            "And the birds give praise to Thee,\n"
            "Declare unto Thee: Hosanna, hosanna."
        )
    },
    {
        "id": "20",
        "title": "Blessed Be the King of Kings",
        "lyrics": (
            "Blessed be the King of kings,\n"
            "Who with His mighty arm\n"
            "Delivered us.\n"
            "Blessed be His holy Name,\n"
            "Because He hath given us\n"
            "Great protection.\n"
            "Glory to Jesus Christ, for\n"
            "He is worthy of adoration.\n\n"
            "CHORUS: \n"
            "Glory to Christ my King,\n"
            "Glory to my great King;\n"
            "Hallelujah, let us sing unto Him,\n"
            "For His mighty power.\n\n"
            "Great gladness and rejoicing\n"
            "Is in the holy Church\n"
            "Of the Lord.\n"
            "To see fulfilled unto this day\n"
            "That we are gathered all in one accord;\n"
            "All of us praising;\n"
            "Jesus Christ, the King of Zion.\n\n"
            "Holy Church of the faithful Lamb\n"
            "Today is the day to worship God,\n"
            "For the victories and mighty deeds\n"
            "Which hath poured forth\n"
            "Christ the Savior.\n"
            "Glory to Jesus Christ,\n"
            "He who poureth out His blessing.\n\n"
            "Unto Jesus Christ, the King of kings,\n"
            "Who sitteth upon His majesty;\n"
            "Be His holy Name glorified,\n"
            "Because He hath overcome\n"
            "The fierce tempter; by His mighty power\n"
            "Which holdeth dominion over the dragon."
        )
    }
]

sp_data = json.loads(spanish_raw)

print(f"Total Spanish items: {len(sp_data)}")
print(f"Total English items: {len(translations)}")
assert len(sp_data) == len(translations), "Length mismatch"

all_passed = True
for idx, (sp, en) in enumerate(zip(sp_data, translations)):
    # 1. ID check
    if sp["id"] != en["id"]:
        print(f"[{idx+1}] ID mismatch: {sp['id']} != {en['id']}")
        all_passed = False
    
    # 2. Stanza check
    sp_stanzas = sp["lyrics"].split("\n\n")
    en_stanzas = en["lyrics"].split("\n\n")
    if len(sp_stanzas) != len(en_stanzas):
        print(f"[{idx+1}] Stanza count mismatch: {len(sp_stanzas)} != {len(en_stanzas)}")
        all_passed = False
    
    # 3. Line count check per stanza
    for s_idx, (sp_s, en_s) in enumerate(zip(sp_stanzas, en_stanzas)):
        sp_lines = sp_s.split("\n")
        en_lines = en_s.split("\n")
        if len(sp_lines) != len(en_lines):
            print(f"[{idx+1}] Stanza {s_idx+1} line count mismatch: {len(sp_lines)} != {len(en_lines)}")
            print(f"   SP lines ({len(sp_lines)}): {sp_lines}")
            print(f"   EN lines ({len(en_lines)}): {en_lines}")
            all_passed = False

    # 4. Repeat marker checks
    for marker in ["/:/", ":/:"]:
        sp_count = sp["lyrics"].count(marker)
        en_count = en["lyrics"].count(marker)
        if sp_count != en_count:
            print(f"[{idx+1}] Repeat marker '{marker}' count mismatch: {sp_count} != {en_count}")
            all_passed = False

    # 5. Coro check
    if "CORO:" in sp["lyrics"] and "CHORUS:" not in en["lyrics"]:
        print(f"[{idx+1}] Missing CHORUS: where CORO: was expected")
        all_passed = False
    if "Coro:" in sp["lyrics"] and "Chorus:" not in en["lyrics"]:
        print(f"[{idx+1}] Missing Chorus: where Coro: was expected")
        all_passed = False

if all_passed:
    print("ALL VALIDATION CHECKS PASSED PERFECTLY!")
else:
    print("SOME CHECKS FAILED!")
