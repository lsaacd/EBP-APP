import type { Language } from '../context/LanguageContext';

export interface HymnTranslation {
  title: string;
  lyrics: string;
}

export interface LocalizableHymn {
  id: string | number;
  title: string;
  lyrics: string;
  [key: string]: any;
}

/**
 * English translations for all 761 hymns ('1'..'637') and estribillos ('E1'..'E124'),
 * keyed by exact Spanish entry ID. Populated cleanly outside alabanzasPaginas.js
 * so canonical Spanish data, audio URLs, favorites, and playlist IDs stay intact.
 */
export const ALABANZAS_ENGLISH: Record<string, HymnTranslation> = {
  "1": {
    "title": "Behold, Thou Art Fair",
    "lyrics": "Behold, Thou art fair,\nO Redeemer Jesus, my Benefactor!\nThou didst impart unto me Thy love,\nDrawing my soul out from error.\nMy beloved is white and ruddy,\nAnd chiefest among ten thousand;\nAnd His head is as the finest gold,\nAnd His splendor is like the sun.\n\nChorus: Song of songs,\nHis people sing;\nThou art fair, O holy Lamb.\nWithin my soul Thou art\nImprinted, upon my heart;\nThy love is sweet unto my soul.\n\nMy Redeemer, He is most fair,\nAnd with His love He fills my heart;\nAnd in the arms of Jesus\nMy heart doth take delight;\nEven as the shepherd takes his sheep,\nSo Jesus hath shown His love;\nAnd now I cry with a loud voice:\nI live rejoicing in my Jesus!\n\nI am Christ's, and Christ is mine,\nThe witness Christ hath given;\nFor He is imprinted in my being,\nAnd I am marked in Him.\nI can say that I am my beloved's,\nFor He hath set His seal upon me;\nAnd if I live, it is for Christ,\nAnd if I die, it is for Him."
  },
  "2": {
    "title": "Worship from the Heavens",
    "lyrics": "Worship Him from the heavens,\nIn the heights above, adore;\nAngels of light, give Him honor,\nO ye heavenly hosts, sing forth.\nSun and moon, give praise unto Him,\nAll ye shining stars, exalt;\nUnto the Lord God of the Heavens\nGive ye praise in choral hymn.\n\nCHORUS: We will adore Thee, O good Savior!\nWe will praise Thee for Thy great love;\nWe will proclaim Thy great salvation,\nHoly redemption, 'tis the gift of my Lord.\n\nPraise ye the King of kings,\nHis promises He will fulfill;\nUnto His people victory\nShall forevermore prevail.\nPraise ye the King of kings,\nGod of our salvation;\nLet Creation, heavens and earth,\nRender worship unto God.\n\nGlory, honor, and high praise,\nWe render unto Thee, O Lord!\nGratitude we express to Thee,\nWe surrender unto Thee our love.\nAngels of heaven adore Him\nRound about His holy throne;\nOffering up songs of praise\nTo the great Name of the Lord."
  },
  "3": {
    "title": "In the Third Heaven",
    "lyrics": "In the third heaven sing thousands of souls,\nThousands are the melodies also;\n/:/ They sing to the Lamb in sweet harmony,\nOh, what a glorious choir is heard up\n yonder/:/\n\nThrough the boundless heaven,\nSky of celestial blue,\nThere already by faith I behold:\n/:/Multitudes of souls in sweet harmony,\nBy faith I bear my soul to that realm beyond/:/\n\nZion, city celestial,\nWhere no longer existeth\nAny sorrow, neither grief nor care,\n/:/Where we shall rejoice likewise in His glory,\nAnd that holy throne which I see beyond/:/\n\nAll we faithful Christians\nWho dwell on the earth below\nShall arrive at our heavenly home,\n/:/Where we shall live in eternal felicity\nWhen from this earthly world we depart at last/:/"
  },
  "4": {
    "title": "Hallelujah! Hallelujah!",
    "lyrics": "/:/Hallelujah, hallelujah, hallelujah,\nHallelujah; praise and laud/:/\n\nCHORUS: Praise and laud, hallelujah.\nPraise and laud, hallelujah;\nPraise and laud, hallelujah,\nPraise and laud\n\n/:/The Lamb that was slain\nIs worthy of praise and laud/:/\n\n/:/Unto the Ancient of Days on the Throne\nOf glory, be praise and laud/:/\n\n/:/Unto the Holy Spirit who is\nAmong us, be praise and laud/:/\n\n/:/These three witnesses\nAgree in one:\nChrist Jesus./:/"
  },
  "5": {
    "title": "One Day I Shall See My Lord",
    "lyrics": "One day I shall see my Lord\nIn the heavenly Homeland fair;\nThere shall ever be my song:\nHoly, Holy, Holy.\n\nCHORUS: Holy, Holy, Holy,\nShall my singing be;\nHoly, Holy, Holy,\nThroughout all eternity.\n\nThere I shall behold my Lord\nIn the bright, refulgent light;\nI shall say to the Lamb of God:\nHoly, Holy, Holy\n\nDwelling in my sweet home above,\nI shall see Christ the Redeemer;\nI will say to Him with gratitude:\nHoly, Holy, Holy."
  },
  "6": {
    "title": "I Bring My Offering to the Altar",
    "lyrics": "I bring my gift to the Altar,\nTo offer it unto the Lord;\nEven as an offering made by fire,\nUnto the glory of God.\n\nCHORUS: I will pay my vows unto God,\nFor this is my bounden duty;\nBecause He delivers me from sin\nAnd from every temptation.\n\nI offer to God my burnt offering,\nEven as David offered to Him;\nWhen he saw himself delivered and saved,\nHis vows unto God he paid.\n\nI bring unto God my offering,\nEven as our father Abraham,\nWhen he offered up his son\nUpon the altar of the Lord.\n\nEven as an offering made by fire,\nIs the blessing of the Lord,\nThat He may receive it\nWith gracious goodwill."
  },
  "7": {
    "title": "Hallelujah to the Lamb",
    "lyrics": "Praise we shall give in the clouds above,\nA song of rejoicing shall be heard;\nThe angels in their multitudes,\nLikewise with gladness shall sing.\n\nCHORUS: Hallelujah to the Lamb,\nLet the whole creation say;\nFor it is heard resounding loud,\n'Tis the heavenly trumpet sound.\nAnd the dead in Jesus Christ,\nAwaken now,\nTo receive the Immortal One.\n\nWhere, O death, is now thy sting?\nWhere, O grave, is thy victory?\nThis shall be the glorious strain,\nIn the mansions of glory on high.\n\nCome, ye blessed of my Father,\nThe Prince of Peace shall say;\nCome unto your inheritance,\nTo rejoice forever and evermore."
  },
  "8": {
    "title": "Sing Ye! Sing Ye!",
    "lyrics": "Sing ye, sing ye with understanding,\nAnd render praises to the King;\nPraises we give to Him to whom we owe\nOur liberty.\n\nCHORUS: Thus we shall march onward to Zion,\nCity of God, which is the Capital;\nAt the head goes Jesus the King,\nCaptain and General\nOf this church, which is Spiritual.\n\nGive ye praises with understanding,\nAnd bless the Name of Christ Jesus;\nThus we shall sing\nTo Him to whom we owe our liberty.\n\nPraise ye, praise the gentle Lamb,\n'Tis He who giveth joy, peace, and comfort;\nAll ye who are washed,\nUnto Christ we give praise and laud\n\nThey that are baptized into Christ Jesus,\nThey rejoice walking in His light;\nLight that shineth forth,\nAnd that Light is Christ Jesus."
  },
  "9": {
    "title": "Song of Songs",
    "lyrics": "Who is she that looketh forth as the morning,\nFair as the moon,\nClear as the sun,\nMajestic as an army with banners?\nThis woman is. . .\nThe Church of God.\n\nCHORUS: /:/Song/:/ Song of songs,\n/:/Song/:/ Songs celestial,\n/:/Sing ye/:/ Let us mortals sing,\nOf the Church of the Living God,\nThe Good Shepherd.\n\nWho is she that riseth up from the wilderness,\nLike a pillar of smoke,\nLike a honeycomb of sweet honey,\nPerfumed with myrrh and frankincense\nThis woman is. . .\nThe Church of God\n\nThy plants are an orchard of pomegranates,\nWith pleasant camphire and spikenard,\nAnd of beauty without peer;\n'Tis the Church that singeth to the Living God,\nPillar and Ground of the Truth."
  },
  "10": {
    "title": "When Jesus Made His Triumphal Entry",
    "lyrics": "When Jesus made into Jerusalem\nHis triumphal entry;\nTo His beloved flock He gave liberty;\nUpon a humble colt\nRode the King;\nThereby He showed us how vain is\nLuxury, and pomp is vanity.\n\nCHORUS: Hosanna, they sang to the Son of David,\nBlessed is He that cometh\nIn the Name of the Lord!\nGlory in the highest,\nThey sang with one accord,\nAnd glory we sing\nLikewise this day.\n\nO daughter of Zion!\nThy King cometh here;\nThe Paschal Lamb,\nTaketh possession of His Kingdom here.\nKing of the ages, the Desired of nations;\nHe established the law of liberty,\nHis yoke is easy.\n\nA loud voice was heard of sweet\nSinging, from the multitudes\nThat came with Him,\nTheir song was as one.\nAnd from the little ones,\nAs it is written,\nThere must needs go forth,\nGlory and high praises,\nUnto the Father Celestial."
  },
  "11": {
    "title": "I Long in Royal Mansions to Dwell…",
    "lyrics": "I long in royal mansions to dwell,\nWhere my Savior reigns;\nI hear the echoes of a sweet song of triumph, of glorious praise.\n\nCHORUS: Unto my supreme King, joyfully I will sing;\nMine eyes shall behold the celestial shore;\nHappy and free am I, and onward I go\nWith gladness to my eternal home.\n\nAlong rugged paths perchance I must walk,\nThe world shall forget me here;\nYet on the shores of the crystal-clear sea\nThe saints await me now.\n\nGlorious hope, ineffable peace,\nWhich my heart doth feel;\nHow sweet to have fellowship and delight\nWith God in adoration!\n\nLift up thine eyes and behold Jesus,\nBe faithful to thy King and Lord;\nThe radiant beams that encircle the cross\nEnfold thee in their splendor."
  },
  "12": {
    "title": "Now Is the Time to Praise the Lord",
    "lyrics": "Now is the time\nTo praise the Lord;\n'Tis the time to give Him laud;\nAll ye with joyfulness\nRender Him honor and praise.\n\nHallelujah to the Great King, the Lord,\nHallelujah for His great goodness;\nBlessed be Emmanuel the King,\nGlory to Him;\nHallelujah, sing praises to Him.\n\nNow is the time\nTo worship the Great God,\nAnd the time is now fulfilled;\nWherein all the saints\nShall give praise unto the Lord.\n\nToday is the day when to all of us here\nOur joy is fully fulfilled,\nContemplating the glory\nOf the Holy Spirit of God.\n\nHallelujah, hallelujah to the Lord,\nHallelujah, hallelujah, Amen;\nHallelujah, hallelujah;\nHallelujah to the Lamb of God."
  },
  "13": {
    "title": "The Angels Praise the Lord",
    "lyrics": "The angels of heaven\nPraise the Lord;\nThe cherubim likewise\nGive Him laud. Oh, how glorious 'twill be\nTo be yonder in fullness of joy,\nBeside my Lord,\nAnd to delight in His beautiful light,\nIn eternal security!\n\nCHORUS: Onward we are walking,\nYea, onward we march,\nTo arrive yonder with Him;\nLet no one tarry, run on in your race,\nFor the holy prize\nIn Christ is found.\n\nThe birds of the air each day\nBless the Creator;\nWith songs of joyfulness\nAnd gratitude. What happiness,\nTo taste of His goodness,\nWith His great love,\nWhich He hath poured into the heart\nTo worship Him in truth!\n\nHis people here on earth\nRender Him adoration;\nBecause they have partaken\nOf His forgiveness.\nThe Lord Jesus redeemed them\nBy His power, granted them holiness,\nThat they might be a people for His own,\nThrough all eternity."
  },
  "14": {
    "title": "Give Praises unto Emmanuel",
    "lyrics": "Give praises unto Emmanuel,\nWho is declared to be God;\nPraise Him, all ye, with love,\nHe who redeemed Israel.\n\nCHORUS:\nPraise. . . unto holy Emmanuel,\nPraise. . . unto Him who saved and redeemed;\nPraise and laud. . . Hallelujah, Amen,\nHallelujah to the King of Zion.\n\nGive praises unto Christ the King,\nHoly and faithful Lamb;\nAll ye prostrate, adore Him,\nHe who redeemed Israel.\n\nGive praises to Him who overcame\nThe fierce tempter;\nFor with His arm of power,\nHe redeemed Israel.\n\nUnto Jesus Christ our King,\nPraise. . . praise. . . praise;\nWho showeth forth His great power today,\nPraise; laud and praise."
  },
  "15": {
    "title": "Let All Sing unto the Lord",
    "lyrics": "Let All Sing unto the Lord,\nAcknowledge His favor;\nAll in faithful communion,\nBless the Most High God.\n\nCHORUS:  Sing, sing, yea, sing. . .\nSing, sing unto Jesus;\nFor His ineffable goodness,\nWas poured out on the cross.\n\nCease now from thine evil doing,\nAnd serve thy Creator;\nCome, humble thyself before Him,\nAnd thou shalt obtain blessing.\n\nGlory to the Son of David,\nCried the great multitude;\nGlory let us sing here below,\nFor He hath given us salvation.\n\nLet the congregation sing\nUnto Christ my Savior;\nHe will grant us blessing,\nAnd an inheritance in His mansion."
  },
  "16": {
    "title": "The Joy This Church Hath Today",
    "lyrics": "The joy that this church\nHath today. . .  Is of the King,\nThe Holy One of Israel.\nFor soon He cometh with power\n/:/To gather His flock/:/\n\nCHORUS: Worthy art Thou, Lamb of God;\nTo receive the power;\nHonor and glory my soul shall give Thee.\n\nCry out with a loud voice, saying\nThus. . .    Salvation!\nUnto the King of Creation,\nAll ye that fear Him, praise,\n. . .Jesus!\n/:/The Holy One of Israel/:/\n\nWith joy give praise to Emmanuel,\n. . .Glory to Him!\nFor He hath set us free,\nDying thus upon a cross,\n. . .In love!\n/:/To grant us power/:/\n\nLet us all rejoice in the communion,\n. . . Of Jesus!\nSinging with one voice,\nHosanna to the Son of David!\n. . . Our King!\n/:/Blessed be the Redeemer/:/"
  },
  "17": {
    "title": "Glory! Glory!",
    "lyrics": "And with His blood\nHe washed away our guilt;\nAnd our souls\nHe redeemed forevermore.\nHe saved and redeemed us,\nAnd life eternal forever\nHe freely offered.\n\nCHORUS:\nGlory, glory, glory;\nUnto the Lamb of God.\n/:/Glory to the Lamb\nWho died for our salvation/:/\nGlory, glory, glory;\nUnto the Lamb of God.\n\nAnd Jesus saith to everyone\nWho cometh unto Me,\nHe shall go to enjoy the mansions\nCelestial, there to live,\nTo reign, and to rejoice,\nWith the Divine Savior.\n\nHe is the fountain\nInexhaustible of salvation,\nCleansing the soul\nWith His blood out-poured;\nThat we might have the salvation,\nOffered to me\nBy my Savior, Christ Jesus."
  },
  "18": {
    "title": "Give Praises unto Christ",
    "lyrics": "Give praises unto Christ the King,\nExalted and Sovereign Lord;\nAnd proclaim His love and law\nTo every human being;\nStrike vibrant notes of melody,\nTune every soul to sing;\nIn sweet celestial harmony,\nPraise, praise, praise to Christ the King\n\nCHORUS: \n/:/Praise and glory to Christ the King/:/\nGlory, praises, and majesty,\nOmnipotence and lovingkindness,\nTo the eternal King.\n/:/Praise and glory to Christ the King/:/\nKing of kings, immortal Lord\nPraise to Christ the King.\n\nGive praises unto Christ the King,\nIn fervent songs of joy;\nHe shall have dominion from sea to sea\nOver the nations of the world,\nAnd round about His glorious throne\nGlad souls with fervent love,\nIn triumphant strains shall sing.\nPraise, praise, praise, praise;\nUnto Christ the King.\n\nGive praises unto Christ the King,\nThe risen, living Lord;\nWho the strong and cruel foe\nHath vanquished in triumph,\nAnd all the legions of Satan,\nOur Captain hath overcome,\nLet heaven, earth, and sea resound;\nPraise, praise, praise, praise;\nUnto Christ the King."
  },
  "19": {
    "title": "Hosanna! King of Glory",
    "lyrics": "Hosanna, King of Glory,\nThy greatness cannot be contained within Thy glory;\nNeither in the heavens, nor in the seas\nNor on earth, nor in Thy glory.\n\nCHORUS: \nHosanna, King of Glory,\nThou art the early rain;\nThou art our joyful singing,\nHosanna,  hosanna,  hosanna.\n\nHosanna, King of Glory,\nUnto Thee the angels cry;\nThe waves and the mighty seas,\nDeclare unto Thee: Hosanna, hosanna.\n\nHosanna, King of Glory,\nThou art the Bright Morning Star,\nThou art the dew, Thou art light of day,\nThou art the early rain.\n\nHosanna, King of Glory,\nThe flowers yield their sweet perfume unto Thee:\nAnd the birds give praise to Thee,\nDeclare unto Thee: Hosanna, hosanna."
  },
  "20": {
    "title": "Blessed Be the King of Kings",
    "lyrics": "Blessed be the King of kings,\nWho with His mighty arm\nDelivered us.\nBlessed be His holy Name,\nBecause He hath given us\nGreat protection.\nGlory to Jesus Christ, for\nHe is worthy of adoration.\n\nCHORUS: \nGlory to Christ my King,\nGlory to my great King;\nHallelujah, let us sing unto Him,\nFor His mighty power.\n\nGreat gladness and rejoicing\nIs in the holy Church\nOf the Lord.\nTo see fulfilled unto this day\nThat we are gathered all in one accord;\nAll of us praising;\nJesus Christ, the King of Zion.\n\nHoly Church of the faithful Lamb\nToday is the day to worship God,\nFor the victories and mighty deeds\nWhich hath poured forth\nChrist the Savior.\nGlory to Jesus Christ,\nHe who poureth out His blessing.\n\nUnto Jesus Christ, the King of kings,\nWho sitteth upon His majesty;\nBe His holy Name glorified,\nBecause He hath overcome\nThe fierce tempter; by His mighty power\nWhich holdeth dominion over the dragon."
  },
  "21": {
    "title": "Path of Thistles",
    "lyrics": "O Christ of my soul,\nO Jesus of Nazareth,\nRestore unto me sweet calm,\nAnd comfort Thou my being.\n\nCHORUS: \nA path I walk of thistles,\nAnd thorns spring up on every side,\nTransform Thou the thorn into spikenard,\nPerfume Thou my whole being.\n\nLeave me not from Thy hand,\nSuffer me not to perish,\nKeep me in Thy holy bosom,\nO Jesus of Nazareth.\n\nThe perils of this life,\nPursue me on every hand,\nYet my Christ doth guide me on,\nHe will help me to overcome.\n\nThe sorrows are passing away,\nThere is a new dawning day,\nMy light is shining bright,\nIt is Jesus of Nazareth."
  },
  "22": {
    "title": "The Church Has a King",
    "lyrics": "The church hath a King,  Hallelujah!\nCalled Emmanuel. . .  Glory to Him;\nFor the Lamb is the Great Lord,\nThe Great Lord of Israel.\n\nCHORUS: \nAnointed was He. . .  With oil of love!\nHe hath the power. . .   To overcome!\nThe Great Lord.\nGlory, glory, glory to Him,\nHe is the King of Israel.\nAn example He gave. . .   With His blood He marked it\nUnto His people. . . . Thus He gave them,\nLiberty.\nGlory, glory, glory to Him;\nHe is the King of Israel.\n\nToday let us extol. . .  His Name,\nIt is Christ the Saviour, glory to Him;\nFor the Lamb is He, the Great Lord,\nThe Great Lord of Israel.\n\nThe church shall rejoice in glory,\nWith Christ my Lord, in liberty;\nFor God promised to bring her to Zion,\nAnd marked her upon His heart."
  },
  "23": {
    "title": "Youth, Let Us Labor",
    "lyrics": "Youth, let us labor and let us extol Jesus,\nProclaiming to the world that Jesus is the truth;\nSuffering for His cause, teaching of His light,\nClothed with the breastplate of faith, righteousness, and charity.\n\nCHORUS: \nO youth, let us all go forth striving,\nWith the weapons of our Saviour;\nLet us walk ever ready with courage,\nTo combat, fighting against the tempter.\nO youth, with fervor let us follow ever,\nPraising and extolling the Creator;\nAnd at last we shall reach the celestial mansion,\nWith Christ our Saviour.\n\nEver steadfast and onward, lifting high the banner,\nProclaiming with righteousness the Word of the Lord;\nHe is good and compassionate, protecting us with His love,\nAnd if unto Him we draw near today, a reward awaits us.\n\nO youth, steadfastness in the Lord is needful,\nLet us be strong, fighting against the fierce tempter;\nHe that overcometh is worthy of His kingdom and His love,\nAnd an eternal crown of salvation awaits him there.\n\nIf thou strivest today, fighting in the field of pain,\nHis staff imparteth comfort and shall deliver thee from error;\nO youth, faint thou no more, nay,\nJesus is our Guide."
  },
  "24": {
    "title": "If Strength Faileth Thee to Walk",
    "lyrics": "If strength faileth thee to walk,\nAnd faith thou hast no more;\nBring unto Christ thy need,\nAnd strength shalt thou have, God shall give it thee.\n\nCHORUS: \nHe giveth power to the faint,\nAnd increaseth strength\nTo him that hath no might;\nJehovah shall give new strength,\nThat we may walk.\n\nThe youths grow weary, they falter and fall,\nEven the young men likewise;\nBut they that wait upon Christ Jesus\nShall not grow weary, nor shall they stumble.\n\nAll they that wait upon Christ Jesus\nShall have new strength;\nThey shall be as eagles to fly;\nThey shall not be weary to walk.\n\nGlad and joyful shalt thou ever be,\nAbiding with Christ;\nThe trials thou hast shall not turn thee away,\nTriumphant shalt thou come forth, God shall help thee."
  },
  "25": {
    "title": "The Final Day",
    "lyrics": "The end of days shall come. . . \nYEA IT SHALL COME\nI would not wish to think of it, much less be there,\nThe sun shall be darkened;\nAnd the moon into blood shall be turned,\n/:/I DO NOT WISH TO BEHOLD THE FINAL DAY/:/\n\nDeath shall be sought. . . \nYEA IT SHALL BE\nUnto the rocks they shall flee and cast themselves down,\nAnd death they shall not find;\nAnd only the wrath of God shall they find,\n/:/I DO NOT WISH TO BEHOLD THE FINAL DAY/:/\n\nThe devil shall come to his end. . . IT SHALL COME\nDestroyed he shall be for ever and ever,\nHis wound shall be mortal;\nAnd in the lake of burning brimstone he shall be,\n/:/I DO NOT WISH TO BEHOLD THE FINAL DAY/:/\n\nThe wrath of God shall be seen. . . YEA IT SHALL BE\nThe Lion of Judah, a consuming fire,\nHis sword is gleaming bright;\nAnd the wicked and unjust He shall destroy,\n/:/I DO NOT WISH TO BEHOLD THE FINAL DAY/:/"
  },
  "26": {
    "title": "I Feel Joy Within Me",
    "lyrics": "I feel joy, joy within me,\nAs I recall the story,\nHow I came here unto this fold,\nWhen I did not know,\nThe Good Shepherd of glory;\n\nCHORUS: \nGlory! Glory! unto Christ,\nNow I sing glory unto Him;\nBlessed the day when Christ,\nSpake unto me.\n\nI sing, sing, sing unto Him who spake to me,\nWhile I was walking lost,\nAnd He persuaded me with His gentle speech,\nI did not know,\nIf it were the voice of Christ.\n\nI had, had, had the joy of being\nOne day baptized\nIn His name, which can forgive\nAll sins,\nUnto him that believeth in His name.\n\nI feel joy, joy, and gratitude,\nBecause I now have life,\nChrist gave it to me. Glory to the Lord!\nBecause He is good,\nBecause through Him there is life."
  },
  "27": {
    "title": "Glory to God!",
    "lyrics": "Glory we give Thee, O Lord,\nOn this pleasant day;\nMay Thy people sing praises\nAt the marriage of the Lamb.\n\nCHORUS: \nGlory to God in the highest,\nAnd to the Heavenly Lamb;\nMay Thy people sing glory,\nThroughout all eternity.\n\nThis Heavenly banquet,\nIs not bought with money;\nWith the blood of the Lamb,\nShed upon the tree.\n\nWe are Thy chosen people,\nBy the grace of the Lord;\nTherefore we sing praises,\nUnto the Divine Redeemer."
  },
  "28": {
    "title": "Love! Love!",
    "lyrics": "Love, love, our God requireth,\nLove unto Him, and to our neighbor too;\nBlessed love, that cometh from the Lord,\nLove of the Holy Redeemer.\n\nCHORUS: \nThe love of God, Jesus revealed;\nIn dying upon the cross.\n\nIf thou and I suffer with love,\nCruel anguish, for the sake of the Lord;\nThere with Him we shall have a reward,\nIn that celestial mansion.\n\nFaithful Lamb, who givest salvation,\nCome unto my soul and fill it with Thy love;\nAnd with fervor in the midst of pain,\nThine shall be my heart."
  },
  "29": {
    "title": "Hosanna! King of Glory",
    "lyrics": "Hosanna, King of Glory,\nHosanna, King of Israel;\nThou art the gate of Heaven,\nThou art our Emmanuel.\n\nCHORUS: Let us glorify the Name of Christ,\nPraise Him for His goodness;\nWho, leaving His Throne of glory,\nGave unto souls their liberty.\nLet us glorify the Name of Christ,\nPraise ye Him alone;\nHosanna, King of glory.\nHosanna, King of Israel.\n\nThou art the precious stone,\nChosen and laid in Zion;\nUnto many a stumbling block,\nAnd unto Thy people salvation.\n\nHe saved the malefactor,\nAt His right hand on the cross;\nFor there is no name that saveth,\nOnly the Name of Jesus.\n\nGlory, glory, Hallelujah,\nGlory, glory to the Saviour;\nGlory, glory, Hallelujah,\nGlory, glory to our God."
  },
  "30": {
    "title": "Who Shall Separate Us?",
    "lyrics": "Who shall separate us from the holy love\nOf the Saviour, which we enjoy today?\nNo,   no,   nothing shall separate us,\nFrom the Heavenly Father.\n\nCHORUS: \nNeither height, nor depth,\nNor any power;\nNothing shall separate us,\nFrom the Heavenly Father.\n\nSore temptation seeketh to sever,\nKing Jesus from our heart;\nNo,   no,   nothing shall separate us,\nFrom the Heavenly Father.\n\nIn our battle, Jesus is present,\nTo rebuke the fierce tempest;\nNo,   no,   nothing shall separate us\nFrom the Heavenly Father."
  },
  "31": {
    "title": "Contend, Ye Youth",
    "lyrics": "Let us contend, O youth, for the faith,\nThough the world and Satan roar;\nIn the fight they shall never overcome us,\nFor Jesus will keep us.\n\nCHORUS: \nIf we suffer here, we shall reign yonder,\nIn His celestial kingdom;\nIf we bear the cross,\nFor the love of Jesus,\nThe crown He will give us.\n\nLet us not be lukewarm in heart,\nNor ever leave our first love;\nLet us hold fast the profession,\nOf the faith of the Saviour.\n\nForward, O youth, with courage,\nLet us defend what the Lord hath given us;\nLet us put on the power of God,\nOf righteousness and holiness."
  },
  "32": {
    "title": "The Messenger of Christ",
    "lyrics": "How beautiful upon the mountains are the feet\nOf him that bringeth good tidings of salvation,\nOf him that saith unto the nations, Thy God reigneth,\nAnd for ever and ever He shall reign.\n\nCHORUS: \nA life full of peace,\nFull of holiness,\nFull of Christ shall it be,\nFor him who desireth to preach.\n\nIt is lovely to behold along the hedges,\nThe faces of the servants of the Lord;\nMore beautiful still to hear when they speak unto us,\nThe word that descended from heaven.\n\nHe who beareth the gospel through the villages,\nWorthy of double honor ought to be;\nFor his life is filled with Jesus Christ,\nAnd unto the people he imparteth it everywhere.\n\nThey go forth weeping along the way,\nYet afterward with rejoicing they shall return;\nTheir sheaves they shall bring unto Jesus Christ,\nWho shall say, \"My servant, come and rest.\""
  },
  "33": {
    "title": "All the Redeemed",
    "lyrics": "All ye redeemed,\nBy the God of Israel;\nAll ye chosen ones,\nSing ye unto our King.\n\nCHORUS \nBlessed be the name of my King,\nUnto His Name be the honor;\nHallelujah, for He delivered us,\nFrom the power of the tempter.\n\nAll ye redeemed,\nFrom the bond of wickedness;\nAll full of gratitude,\nBecause He set us free.\n\nThanks be to the King of heaven,\nWho giveth us salvation;\nAll the chosen ones,\nBless their God.\n\nAll the chosen ones,\nUnto Salvation \nAll who have been set free,\nSing ye unto our King."
  },
  "34": {
    "title": "O How Good and How Pleasant!",
    "lyrics": "O how good and how pleasant it is to praise Thee!\nO blessed Lord! all united as one;\nThou art worthy of glory and praise,\nThou didst bring us forth from evil ways.\n\nCHORUS: Fill Thou, O Lord, my heart,\nFill it this day with Thy power;\nThat I may be faithful unto Thee,\nAnd go to enjoy a better life.\n\nWe trust, O Lord, that Thou wilt hear us,\nThis day we are asking that Thou fill us;\nWith the divine fire which Thou dost send\nTo him who asketh Thee and seeketh Thee with all his soul.\n\nThis day we give Thee thanks, O blessed God,\nFor having answered the prayer;\nWhich we lifted up to the Throne of Thy Grace,\nAnd Thou didst deign to fill our heart."
  },
  "35": {
    "title": "Who Is She?",
    "lyrics": "Who is she,\nThat looketh forth as the morning,\nFair as the moon,\nClear as the sun,\nTerrible as an army with banners?\nIt is the church of the Lord.\n\nCHORUS: \nHallelujah! Hallelujah!\nUnto Him that saved us,\nBefore us He doth go,\nGlory to God in the highest,\nAnd on earth peace,\nGood will toward men.\n\nGo forth, O ye daughters of Zion!\nAnd behold King Solomon,\nWith the crown wherewith he was crowned,\nIn the day of the gladness of his heart.\nBehold Jesus,\nThe Lord and King.\n\nWho is she that cometh up\nOut of the wilderness like\nA pillar of smoke?\nIt is the Church of the Lord,\nShe was purchased with the blood\nOf the Lamb, and awaiteth her Lord.\n\nThis is the Church of God,\nWhich in the wilderness did abide;\nBy the word of the God\nOf heaven, today Jesus Christ\nBringeth her forth to light;\nCome, sinner, unto the Lord Jesus."
  },
  "36": {
    "title": "Come, Ye Faithful of God",
    "lyrics": "/:/Come, ye faithful of God,\nAnd let us bless our King;\nCome ye, and with love,\nAnd let us honor our God/:/\n\nCHORUS: \nO what happiness!\nO how great is His goodness!\nWhich we enjoy in liberty,\nThrough Jesus Christ,\nBlessed be His goodness.\n\n/:/Come, ye faithful of God,\nAnd let us confess what the Lord\nHath wrought, by His love;\nWho gave unto us of His peace and light/:/\n\n/:/Come ye, and partake,\nOf that which Christ prepared for us;\nLet us commemorate today\nOur day of liberty/:/"
  },
  "37": {
    "title": "Blessed Be Jehovah",
    "lyrics": "Blessed be Jehovah,\nGod of Israel,\nFrom eternity to eternity;\nAnd let all\nHis faithful people say,\nAnd let all His people say, Amen.\n\nCHORUS: \nLet the heavens be glad,\nAnd let the earth rejoice:\nAnd let the nations say,\nJehovah reigneth!\nFor great is Jehovah,\nAnd worthy to be praised.\n\nBlessed be He who gave us\nSalvation,\nAnd brought us out from paths of wickedness;\nNow all His people assembled together,\nSing unto Him and render Him praise.\n\nThe angels in heaven,\nRender unto Him\nBefore His majesty adoration,\nAnd let the people of Israel say,\nThat He is good,\nAnd for ever is faithful.\n\nUnto the King of Creation\nWho formed us,\nLet us sing today\nUnto Him with thanksgiving,\nBlessed God of eternity,\nBlessed God of all power."
  },
  "38": {
    "title": "Lord! Lord!",
    "lyrics": "Lord, Lord, we come with love,\nDesiring, Lord Jesus,\nThat Thou give us blessing,\nIn this holy gathering.\n\nCHORUS: \nHoly, Holy, Lord,\nWho wast and who art;\nPour out a great blessing\nIn this holy gathering.\n\nUnited today let us sing with fervor,\nFor the happiness;\nWhich is reigning now,\nIn this holy gathering.\n\nLord! Lord! blessed be Thy goodness,\nFor all Thy servants today,\nAre united together,\nIn this holy gathering."
  },
  "39": {
    "title": "Run Thy Race",
    "lyrics": "Run on thy race, brother in the Lord,\nBe not discouraged, fight with courage;\nLook unto Jesus Christ, the gentle Shepherd,\nWith His arms opened wide,\nWaiting for thy coming.\n\nCHORUS: \nPonder not in doubt,\nFor soon we shall arrive at home;\nNeither grow faint, rely thou\nUpon the name of Jehovah.\n\nTake in thy hand, brother in the Lord,\nThe precious sword which the Lord giveth thee,\nThat thou mayest destroy what the tempter\nHath placed in thy pathway,\nTo cause thee to faint.\n\nRun on thy race, brother in the Lord,\nBe not disheartened, strive with earnest zeal;\nLook to the crown, the reward of the Lord,\nFor them that strive faithfully,\nFor the cause of the Lord."
  },
  "40": {
    "title": "The Old Covenant",
    "lyrics": "The old covenant written on two stones,\nThey were graven by the hand of God;\nThen were they broken at the foot of the great mount,\nBecause the people of God had transgressed them.\n\nCHORUS: \nOf the old covenant have thou no fear,\nIt is waxed old, Saint Paul declared;\n/:/Mediator of a new one is Christ the Lord/:/\n\nAll was a shadow of the body of Christ,\nAll was an outline of reality;\nThat covenant written on tablets exists no more,\nOnly the holy book, the Bible of God.\n\nA new covenant written not on tables of stone,\nHath been graven upon thy heart;\nNot with the hand of man as was the first,\nBut with the Holy Spirit of God."
  },
  "41": {
    "title": "There Is Joy in Heaven",
    "lyrics": "There is joy in heaven,\nGladness, peace, and love;\nThe angels are singing\nRound about,\nBefore the splendor\nOf Christ the Lord:\nHoly, Holy, Holy;\nBlessed Redeemer.\n\nCHORUS: \nHoly, Holy, Holy,\nBlessed Redeemer;\nThe angels are singing\nAnd giving Him praise;\nFor He is worthy of honor,\nOf glory and praise;\nTherefore they sing to Thee,\nBlessed Redeemer.\n\nAnd Thine own chosen,\nWhen dwelling in error,\nThou didst deliver them\nFrom the tempter's snare;\nAnd here today they give Thee\nGlory and praise:\nHoly, Holy, Holy,\nBlessed Redeemer.\n\nEven as in heaven,\nSo on earth below,\nThere is peace and comfort\nFor those who see\nThat 'tis good to praise\nAnd declare unto God:\nHoly, Holy, Holy,\nBlessed Redeemer."
  },
  "42": {
    "title": "Joy and Great Blessing",
    "lyrics": "Joy and great blessing\nIs that which we enjoy from our Creator;\n/:/We feel our souls redeemed,\nTherefore we praise Christ,\nThe Sovereign Lord/:/\n\nCHORUS: \nWhat joy, what gladness!\nDoth the redeemed soul feel;\nBlessed is the day\nWherein the people of God rejoice.\n\nThe chosen bride of Christ Jesus\nRenders praises unto her Lord;\n/:/To behold this day so glorious,\nWherein there is rest\nAnd great liberty/:/\n\nUnto Him who liveth for eternity,\nAnd hath brought us forth from iniquity;\n/:/Redeemed with exceeding rejoicing,\nPraises and glories,\nIn token of love/:/"
  },
  "43": {
    "title": "I Would Love Thee, Lord",
    "lyrics": "I would love Thee, Lord, all the days\nOf my life; I would serve Thee, Lord,\nAnd do Thy holy will; if Thou wilt help me,\nO God, I shall ever abide in Thy house,\nEnjoying Thy love and Thy holy blessing.\n\nCHORUS: \nBetter is one day in Thy courts\nThan a thousand years far from Thee;\nBetter is Thy house, O Lord,\nThan to dwell in the tents of wickedness.\n\nI would love Thee, Lord, all the days\nOf my life; I pray Thee take my whole being\nAnd guide me in Thy truth;\nThou art the path of light and the way of life,\nIn Thee am I blessed, O Blessed Savior.\n\nI would love Thee, Lord, and consecrate my life to Thee;\nI desire sweet communion and a clean heart;\nThus shall I walk with great joy in my soul,\nSinging praises to Thee, O Blessed Redeemer."
  },
  "44": {
    "title": "My Conversion",
    "lyrics": "I recall that wondrous day\nWhen I was baptized;\nThe first joy of my soul\nI could not contain;\nThe tidings were brought unto me\nThat I was no longer in debt:\n/:/O what a great surprise!\nJesus was my Surety/:/\n\nIn time I was led\nBy a servant of God;\nMuch had he pleaded with me\nTo accept his invitation.\nWhat was my great surprise\nUpon hearing the sermon:\n\"God hath paid for thee,\"\nDid the preacher proclaim,\n\"Come, Jesus calleth thee,\nOpen unto Him thine heart.\"\n\nWhen they baptized me,\nMy soul was deeply moved;\nRevived was the hope\nWhich I had once lost;\nThey told me of a Lamb\nWho died for my transgressions:\n/:/O what great torment\nDid the Redeemer bear for me!/:/\n\nThe time that hath passed\nSince my conversion\nHath been of great joy\nAnd blessed satisfaction;\nAnd though trials may come,\nUnto Him I will ever sing:\n/:/That far better is death\nThan to be a servant of the world/:/"
  },
  "45": {
    "title": "To the Battle!",
    "lyrics": "To the battle, resounds the warlike voice\nOf the Good Jesus who is calling today;\nWithout fainting, follow Him ever with courage,\nAnd full victory He shall grant unto you.\n\nCHORUS: \nTo the battle, O Christians,\nWith the shield of faith!\nBe a good soldier, for at thy side\nStandeth the Prince of Peace;\nHe with His grace doth uphold thee,\nAnd with power without equal:\nHis arm He extendeth and defendeth thee\nIn this warfare against evil.\n\nTo the battle our Savior calleth us;\nGo forth, fight with our Captain!\nIn the unceasing conflict follow without wavering,\nAnd ye shall overcome the hosts of Satan.\n\nUnto the King of kings, our Savior\nJesus, let all render honor and glory,\nFor already His own rejoice\nIn His holy love, and soon shall reign:\nHoliness."
  },
  "46": {
    "title": "In This Gathering, Lord Jesus",
    "lyrics": "In this gathering, Lord Jesus,\nWe give Thee praise for Thy love,\nFor the blessing that dwelleth today\nWithin this Thy flock;\nGlory unto Thee, Lord Jesus,\nGlory and honor unto Thee.\n\nCHORUS: \nGlory, glory, glory\nUnto the Lord of glory... \nThy people sing unto Thee victory... \nVictory!\nUnto the King of glory.\n\nUnited here we offer praise,\nLamb of God, for Thy great love;\nFor Thou didst cleanse my heart,\nAnd my soul is set free;\nBy Thy blood I am saved,\nGlory and honor unto Thee.\n\nAll this flock dedicateth today\nIts songs of love, O Lord!\nBecause it is freed from the tempter,\nIt blesseth its King;\nHallelujah unto the Lord,\nGlory and honor unto Thee."
  },
  "47": {
    "title": "Joy and Peace",
    "lyrics": "Joy and peace, joy and peace\nIn the church of the living God;\nJoy and peace, there is life and holiness,\nThere is joy and liberty,\nThrough our Savior.\n\nCHORUS: \nSing, all ye people, praise ye all,\nBless the Lord,\nAnd declare with one voice:\nLong live Jehovah!\nUnto all eternity.\n\nJoy and peace, joy and peace;\nIn the church of the Lamb,\nJoy and peace, from the Heavenly Father;\nThe God of all goodness\nGranteth us liberty.\n\nJoy and peace, joy and peace;\nIn this new Sanctuary,\nJoy and peace, unto all eternity;\nNow Christ the Redeemer\nHath given us liberty.\n\nJoy and peace, joy and peace;\nIs the heritage of the Christian;\nJoy and peace we shall enjoy today,\nUnited in love,\nSinging to the Redeemer."
  },
  "48": {
    "title": "Let Us Be Glad and Rejoice",
    "lyrics": "Let us be glad and rejoice,\nAnd give honor unto Him,\nFor the marriage\nOf the Lamb is come,\nAnd His wife hath made herself ready.\n\nCHORUS: \nAnd the nations of them that are saved\nShall walk in the light of the city;\nAnd the kings of the earth shall bring\nTheir glory and their honor.\n\nUnto the Lord Jesus be dominion\nThroughout all ages;\nAs King of kings\nAnd Lord of lords,\nJesus Christ reigneth in heaven.\n\nThe Lord Jesus cometh to raise up\nThose who are faithful;\nCome and gather yourselves together\nUnto the supper of the great God,\nThe Lamb who is risen from the dead.\n\nThat holy city, which He went to prepare,\nIs adorned as a bride\nThat serveth the Most High God;\nIt is the church that Christ hath purchased."
  },
  "49": {
    "title": "I Shall Overcome, I Shall Overcome",
    "lyrics": "I shall overcome, I shall overcome; through Jesus I shall overcome,\nI shall overcome, I shall overcome; for God giveth me power.\n\nCHORUS: \nAll the victories\nMy Jesus giveth me, O yes!\n/:/By His mighty power/:/\nAll the victories\nMy Jesus giveth me, O yes!\nUnto Him be all blessing.\n\nThe Word of God is a sword of power,\nWherewith I shall conquer if my faith fail not.\n\nThe shield of faith shall keep me from falling,\nRighteousness and truth guide me unto Jehovah.\n\nI shall overcome, I shall overcome, the battle I shall win,\nAnd thus shall I reach the Heavenly Homeland."
  },
  "50": {
    "title": "A Lamp unto My Path",
    "lyrics": "A lamp unto my path is\nThe Bible of my God;\nA fountain wherein his burning\nThirst the pilgrim shall quench.\n\nCHORUS: \nBeautiful light,\nEver my guidance be,\nUntil with Christ\nIn heaven I shall be.\n\nFood of the soul it is,\nManna and heavenly bread;\nGuide of the traveler, faithful chart\nOf the celestial realm.\n\nIt is the testament of Jesus,\nThe revelation of God;\nWithout it none hath light,\nNor attaineth salvation.\n\nGrant that I may understand,\nO Lord, Thy holy will;\nHave faith in Thy sacred Word,\nAnd Thy statutes obey."
  },
  "51": {
    "title": "The Holy Scroll",
    "lyrics": "The holy scroll Jehovah setteth before thee,\nHe chargeth thee with earnest care;\nThat thou eat what is therein,\nUnto thy salvation.\n\nCHORUS: \nThus saith Jehovah thy Lord:\nEat, be not rebellious;\nOf the manna that giveth life to the heart,\nEat, eat thereof today.\n\nHear, O Israel, what God chargeth thee,\nWith great and earnest care;\nWith His calling He saith unto thee:\nEat, eat thereof today.\n\nChrist biddeth thee to live watchful,\nEver waking in prayer,\nThat thou live with great vigilance,\nConstant in prayer.\n\nBeloved brother, be not thou rebellious,\nLike unto the house of Israel;\nEat thou that which God giveth thee,\nSpiritual manna."
  },
  "52": {
    "title": "How Sweet Is Thy Teaching",
    "lyrics": "How sweet is Thy teaching,\nDivine God, my Savior!\nIt giveth me the strength\nTo fight against the tempter.\nI promise to keep it,\nAnd preach it everywhere;\nI will go to the lost,\nIf Thou go with me, O good Jesus!\n\nCHORUS: \nThe light of God\nHath shined upon me;\nChrist, the light of God,\nCame unto earth;\nI also long to be\nA shining light.\n\nHow sweet is Thy Word!\nSweeter than honey to the taste;\nMy zeal consumeth me\nFor those who forsake Thy truth today;\nThey become enemies\nOf Thy righteousness, O Lord!\nThou shalt render their recompense,\nFor they forgot their Maker.\n\nHow sweet is Thy Word!\nIt is my comfort in my affliction;\nTeach me to obey it,\nAnd keep it within my heart.\nThou wilt grant me Thy grace\nTo overcome temptation;\nI am Thine unprofitable servant,\nWho ever longeth for perfection."
  },
  "53": {
    "title": "There Is a Book That Was Written",
    "lyrics": "There is a book that was written\nBy inspiration of God;\nIt is a book of sacred truths,\nWhich giveth light to the sinner.\n\nCHORUS: Ye do err, said my Lord,\nNot knowing the truth;\nYet the church of God\nDelighteth to meditate\nUpon the efficacious teaching\nWhich the Deliverer brought unto us.\n\nThere is a law that was left\nBy Jesus, who suffered for us;\nIt is the holy Gospel,\nThe Word of divine love.\n\nThe Bible, holy volume,\nTeaching spiritual;\nIts Psalms heal the brokenhearted,\nAll of it is truth divine.\n\nSearch the Scriptures,\nFor it is living and powerful;\nDespise not the instruction,\nAnd with God shalt thou reign."
  },
  "54": {
    "title": "The Holy Scriptures",
    "lyrics": "The Holy Scriptures\nAre the good winnowing fan;\nThey keep well the wheat\nIn the storehouse of God;\nNow the church of Christ\nIs the storehouse of God,\nWhich keepeth the Bread of Life\nAnd the Water of salvation.\n\nCHORUS: Let us go to the storehouse of God,\nLet us sing, \"Hallelujah!\"\nFor the wind is already blowing,\nAnd the wheat is being set apart;\nLet us go to the storehouse of God,\nFor the wind is blowing,\nAnd a feast is prepared\nFor those who are entering in;\nBlow, wind, blow yet more,\nAnd the wheat shalt thou separate;\nBlow, wind, blow yet more,\nAnd the chaff shall fly away.\n\nIf any man hear of the Father,\nAnd cometh to the storehouse of God,\nChrist giveth him to eat,\nEven as He giveth unto me.\nIf thou hunger after righteousness,\nHear the Word of God;\nBlessed shalt thou be,\nAnd filled with consolation.\n\nThe Spirit calleth thee,\nAnd the Bride inviteth thee,\nBidding thee freely\nTo drink of the Water of Life.\nAnd if repentant thou comest,\nThrough the door shalt thou enter;\nAnd in the Name of Jesus Christ\nShalt thou be baptized."
  },
  "55": {
    "title": "I Ever Follow Jesus Christ",
    "lyrics": "I ever follow Jesus Christ\nThe Savior, and in His way I will be faithful;\nI ever follow His pathway,\nWith love I ever desire\nTo walk with Him.\n\nCHORUS: \nThough all should turn aside,\nThough all should depart,\nI will ever be faithful;\nThough all should wander\nFar from their Lord,\nI will ever follow Jesus Christ,\nThe Savior.\n\nMany draw near and say unto the\nLord, \"I will follow Thee, and with Thee I will go,\nAnd I will be faithful in Thy way,\nAnd I will fight, for I am of Thy flock.\"\n\nI will be faithful to Jesus Christ\nIn His way, and His Word I will keep;\n\"Be thou faithful unto death,\"\nHe saith,\n\"And I will give thee the crown of life.\""
  },
  "56": {
    "title": "The Lamb Went and Took the Book",
    "lyrics": "The Lamb went and took the book\nFrom the hand of the Heavenly Father,\nFor He is worthy to open the seals thereof,\nFor in His due time He came to redeem us.\n\nCHORUS: \nToday we adore Thee, Holy Lamb,\nFor Thou art worthy of adoration;\nWe only desire to be with Thee,\nAnd forevermore in Thy mansion.\n\nAnd when He took the Holy Book,\nA mighty sound was heard from thence;\nIt was a prayer ascending\nUnto the exalted throne of our God.\n\nThere in His book are written the names\nOf those purchased by His sorrow;\nThere also are found all the souls\nOf those who suffer for the Lord."
  },
  "57": {
    "title": "In the Bible We Find Instruction",
    "lyrics": "In the Bible we find instruction\nAnd the way to the heavenly Mansion;\n'Mid the trials of life and the blessed hope,\nFrom the Lord we shall receive our reward.\nTrust ye in Jehovah,\nIn Christ alone,\nHe granteth us liberty.\n\nThere are some who today urge unto sin,\nTeaching the doctrine of error;\nYet these hath Jehovah already set apart\nFor the fire and burning of hell.\nThe Lord shall deliver\nThose who do today\nHis holy will.\n\nNever think thou that the wicked shall enter\nInto the glory which the Lord went to prepare;\nIf from the world he turn not from his waywardness,\nWhen he dieth, for him there shall be no place.\nCease, then, from sinning,\nAnd keep in mind\nThat from this world thou must pass away.\n\nIt is the time of trial for the righteous,\nWho would consecrate themselves to the Lord today;\nOn every hand troubles appear,\nIt is the devil who seeketh to disturb them.\nJesus is the Guardian;\nWe must not believe\nIn the wiles of Satan.\n\nHow subtle are the children of this age,\nWho with cunning have sought to beguile!\nThey have tried to hide the Holy Book,\nYet they shall never bring it to pass;\nThe Lord shall send forth\nHis servants, the Word to proclaim."
  },
  "58": {
    "title": "The Great Love of a Savior",
    "lyrics": "The great love of a Savior,\nWho gave His life for a vile sinner,\nEven such as I, I who once lived\nFar from God.\n\nI heard His name,\nSweet name of the Lord;\nAnd it sweetened my heart,\nThat wondrous Name;\nAnd He granted me of His pardon,\nThat great Name which is:\nJesus Christ, the Lord and King.\n\nHe was the Author of redemption,\nThrough His deep wound, through His great love,\nHe who died, died for me,\nBlessed God!\n\nI heard His name,\nSweet name of the Lord;\nAnd it washed my heart,\nThat wondrous Name;\nAnd He gave me His pardon,\nThat great Name which is:\nJesus Christ, the Lord and King.\n\nIn no other name is there pardon,\nOnly in Jesus, my good Savior;\nI know it well, He loveth me,\nFaithful to Him I will be.\n\nI heard His name,\nSweet name of Jesus,\nAnd it shone there upon the cross,\nThat wondrous Name;\nAnd He gave me of His virtue,\nThat great Name which is:\nJesus Christ, the Lord and King."
  },
  "59": {
    "title": "Jesus Loves Me",
    "lyrics": "Jesus, the good Master, loveth me,\nHe would not see my destruction;\n/:/To save me He provided the way,\nHe promiseth to grant my salvation/:/\n\nCHORUS: \nWith joy will I sing\nUnto the God of my salvation;\nMy soul He redeemed,\nThrough the Lord Jesus,\nShowing me His light.\n\nGrant me of Thy divine grace,\nThat my soul may feel Thy pardon;\n/:/That I may ever with my lips\nCall God holy in all things/:/\n\nHe loveth me, I know that He loveth me,\nFor me my Savior suffered;\n/:/Now He standeth interceding\nBefore the Eternal Father on my behalf/:/\n\nWith what great love Thou didst love us,\nDying for all upon the cross;\n/:/There Thou didst wash our souls,\nThou didst redeem us, O Jesus!/:/"
  },
  "60": {
    "title": "I Was a Lost Piece of Silver",
    "lyrics": "I was a lost piece of silver,\nYet my Jesus found me;\nHe sought me diligently,\nAnd His divine grace\nSaved even me.\nHe, kindling the light\nOf the Word of God,\nHath illuminated my soul,\nWhich was in darkness\nAnd bitter death.\n\nCHORUS: \nI have fallen prostrate at the feet\nOf Him who came to die on the cross;\nHe hath laid down His life for me,\nThe glorious and eternal Jesus.\n\nI was a lost sheep,\nThat long time wandered astray;\nYet the heavenly Shepherd,\nWhom my soul desired,\nI have found at last.\nThe ninety and nine He left,\nAnd went after that which was lost;\nUnto my lost soul\nHe stretched forth His arms,\nAnd comforted it.\n\nI forgot my Father,\nAnd wasted all my substance;\nThen straightway came the famine\nIn that distant country,\nAnd I returned.\nMy Father forgave me,\nAnd forthwith I bowed low:\n\"Make me as one of Thy hired servants,\"\nI said unto my Father,\nAnd He lifted me up."
  },
  "61": {
    "title": "I Walk with Christ",
    "lyrics": "I walk with Christ along the path of\nLight, I am with my Jesus, I walk\nWith Christ, He is my dearest Friend.\n\nCHORUS: In Christ my King and Lord,\nSaved now am I;\nWith Him into glory I shall enter\nBy grace and faith, oh yes,\nIn Christ I found joy and peace,\nBecause He loved me;\nIn Christ I found joy and peace\nBeside the cross of my Jesus,\nAnd through Him I go unto His mansion.\n\nI love Christ, He liveth in my heart,\nBecause He is my good Shepherd;\nChrist do I serve; He is my dearest Friend.\n\nChrist is mine, He telleth me that with Him I must\nOvercome,\nAnd that in heaven soon I shall be there with Him.\n\nI feel that Christ liveth in my heart,\nEver since my conversion,\nAnd that His name is unto me the best of all."
  },
  "62": {
    "title": "Salvation the Lord Promised",
    "lyrics": "Salvation the Lord hath promised,\nWhen He came down to suffer here;\nRedemption for the sinner,\nHe found me, and my all to Him I gave.\n\nCHORUS: \nMy soul feeleth joy\nIn God the good King,\nHe hath given me rest,\nAnd I dwell in His flock;\nI will sing praises unto Him forevermore.\n\nNow my God hath poured forth His love,\nHe sent unto us His faithful Son;\nSweet solace unto our sorrow,\nWe shall live yonder with Him.\n\nMajesty, joy, and splendor\nShall be seen when the King shall come,\nTo take those whom He hath saved;\nThey shall rejoice forever, Amen.\n\nGratitude of the sinner,\nWhich he feeleth toward his Lord;\nKnowing that for him He died,\nAnd on the cross redemption gave him."
  },
  "63": {
    "title": "With Gratitude, O Holy God!",
    "lyrics": "With gratitude, O holy God!\nMy soul doth bless Thy goodness;\nThere is in my sin the sweet song\nThat Thou alone knowest how to love.\n\nCHORUS: \nForever is Thy goodness,\nForever is Thy love;\nThy grace is sweet beyond compare,\nFor Thou alone art love:\n\nWith gratitude I come unto Thee,\nTo render Thee my worship;\nI bring my being washed now by Thee,\nIn the laver of the cross.\n\nThou didst deliver me, O Savior,\nFrom my pathways of wickedness;\nMy days of sorrow are passed away,\nI joy in peace and liberty.\n\nA remembrance evermore shall be\nThe sacrifice of Jesus;\nWho, loving the vilest sinner,\nBore all my guilt upon the cross.\n\nA living sacrifice of praise,\nIn Thy presence will I offer;\nWith the perfume of Thine immense love,\nJoyful shall I ever live."
  },
  "64": {
    "title": "Blessing Hath Thy Church Received",
    "lyrics": "Blessing hath Thy church received,\nO blessed Redeemer;\nThou hast given her a new name,\nWritten upon the heart.\n\nCHORUS: \nLove unfeigned,\nDo those hearts possess,\nWho serve Christ in truth;\nLove that came down,\nAnd was engraven on their hearts,\nLove that the Lamb hath sent,\nFrom His Celestial Throne.\n\nStand ye free, all of you today,\nWith that same liberty\nWherewith Christ hath made us free,\nTurning us away from evil.\n\nSalvation and contentment,\nLet us enjoy without ceasing;\nMultitudes of blessings,\nDo cover us more and more.\n\nPresent your bodies this day\nA living sacrifice unto God;\nFor in His tender mercy,\nUnto this hath He redeemed us."
  },
  "65": {
    "title": "With Thy Love and Thy Precious Blood",
    "lyrics": "With Thy love and Thy precious blood\nThou hast cleansed me forever, O Jesus!\nToday I walk in Thy glorious pathway,\nWith my cross, with my cross, O Jesus!\n\nCHORUS: \nThy divine grace doth feed me,\nThy peace-giving love doth sustain me;\nPurest love is this light that shineth,\nOf Thy love, of Thy love give me more.\n\nSuffer me not to forsake Thy path,\nHowever heavy Thy cross may be;\nKindle within my soul a flame\nWith Thy light, with Thy light, O Jesus!\n\nWhen I ascend with Thee to the heavens,\nIn a blessed abode I shall dwell;\nSweet songs of love and comfort,\nI will sing, I will sing, I will sing."
  },
  "66": {
    "title": "God of Love",
    "lyrics": "God of love,\nBlessed Comforter;\nThou who comfortest the heart\nOf every one that seeketh Thee;\nUnto the Savior be all praise,\nGod of love.\n\nCHORUS: \nGod full of mercy,\nBecause Thou art good\nAnd forgiving;\n/:/My soul crieth out,\nUnto the God of love/:/\n\nGod of love,\nUnto him that is found in error,\nThou pardonest his imperfection,\nThou makest him to live,\nAnd bringest him into communion;\nThou causest the sinner to confess.\n\nWhat gratitude,\nThe heart doth feel;\nAll this holy congregation,\nWhich hath now been delivered from error;\nHere Thou art among us,\nThrough Thy love."
  },
  "67": {
    "title": "In Former Times I Found Myself",
    "lyrics": "In former times I found myself,\nIn the shadows of perdition;\nBut the Lord enlightened\nWith His word my heart.\n\nCHORUS: \nAnd of the peace that is found in Thee,\nImpart it into my heart;\nThat I may be able to say,\nThat in Thee salvation is found.\n\nThou art my light, my salvation,\nThou hast saved me with great love;\nNow do I pray that Thou wilt help me,\nTo serve Thee with all my heart.\n\nI heard Thy word and believed it,\nAnd received it into my heart;\nNow I desire to follow Thee faithfully,\nThat I may obtain salvation.\n\nThanksgiving I give Thee, my Savior,\nFor Thy Word, which is the Truth;\nFor through it I was able to find\nLife everlasting and certainty."
  },
  "68": {
    "title": "Fear Not, for I Have Redeemed Thee",
    "lyrics": "Fear not, for I have redeemed thee,\nAnd in My good will I have saved thee:\nAnd in My great love I have called thee,\nI am thy God.\n\nCHORUS: I have given thee a Name, which is:\n“Holiness unto the LORD”, your God;\nThou art called the Church and the Bride,\nThou art redeemed by thy Savior.\n\nFor I the LORD thy God am thine,\nI am the Holy One of Israel;\nAnd I require holiness,\nFor I am holy.\n\nThou hast already My name written upon thee,\nA little stone I gave thee;\nWith My name written thereon;\nI redeemed thee.\n\nWhosoever shall conspire against thee,\nThis man shall be without Me;\nBecause thou hast persecuted Me,\nI am thy Shepherd."
  },
  "69": {
    "title": "Hast Thou Found Peace?",
    "lyrics": "Hast thou found the peace of Jesus Christ?\nDost thou abide in the true conflict?\nHast thou joy such as never was in the world?\nArt thou always victorious in the fight!\n\nCHORUS: \nHast thou found the peace of Jesus Christ?\nDost thou abide in the true conflict?\nPlace thy confidence in Christ,\nIn the secret place of prayer,\nVictory He assureth thee in the fight.\n\nHast thou faith in Jesus the Savior\nWhen the tempest rageth all around?\nArt thou victorious in thy conflicts,\nWhen the tempter seeketh to assail thee!\n\nDost thou walk with Jesus in this life\nIn the beauty of holiness?\nDost thou enjoy the riches of His grace,\nGiving praise unto the Divine Redeemer!\n\nThere is room for thee in His presence\nWhere thou mayest behold His beauty!\nUnto him that walketh in the light He hath promised\nTo give His Holy Spirit, the Comforter."
  },
  "70": {
    "title": "Brother, Tell Us Today",
    "lyrics": "Brother, tell us today something of Jesus,\nTell us again the story of His love;\nDeclare unto us faith, joy, and gratitude,\nTell us again the story of His love.\nDost thou still follow close unto the Lord?\nDoth thy soul burn with the first fervor?\nIs thy cup overflowing with blessing?\nTell us again the story of His love.\n\nCHORUS: \nTell us again the story of the love of the\nSavior,\nSuch a blessed and pleasing story shall make us\nSing of His glory;\nTell us again the story of His love.\n\nAs we hear thy voice speaking of the Lord,\nTell us again the story of His love;\nPerchance a sinner may turn unto God,\nTell us again the story of His love.\nMany are thirsting within their hearts;\nIn the world they seek for pleasure,\nPoint them to the fountain of blessing;\nTell us again the story of His love.\n\nThe help He hath granted thee in temptation,\nTell us again the story of His love;\nThe trial of thy faith and His compassion;\nTell us again the story of His love.\nTell us that Jesus is a faithful Friend,\nThat He is thy Captain and great Shepherd;\nTimely help hast thou found in Him;\nTell us again the story of His love."
  },
  "71": {
    "title": "The Right Hand of the LORD Doeth Valiantly",
    "lyrics": "The right hand of the LORD doeth valiantly,\nI shall not die, but live;\nAnd declare the wonderful works of the LORD,\nAnd the greatness of His hands.\n\nCHORUS: \nWhen the Lord spake thus, “Thou shalt not die,”\nMy soul is filled with joy,\nKnowing that I live in Him,\nKnowing thus that it is no longer I that live,\nNow Christ liveth in me.\n\nThe Savior cometh now with the voice of the archangel,\nHe lifteth up His holy flock;\nAnd they shall be transformed in truth,\nAnd crowned by their King.\n\nThe voice of Him that cometh like thunder\nShall be a dreadful surprise to the sinner,\nFor having departed from the Lord,\nAnd walking in his stubbornness."
  },
  "72": {
    "title": "The King of Glory",
    "lyrics": "The King of glory now is calling,\nUnto salvation all mankind;\nHis richest blessings pouring downward,\nFor health and healing of the soul.\n\nO come. . .! O come, yea, come ye all!\nUnto King Jesus, the Savior;\nUnto Him who died\nTo give us salvation and light.\n\nLost souls wandering on earth,\nEver longing for liberty;\nThe King of glory waiteth for them,\nThat they may partake of His goodness.\n\nThrough His Word He calleth man,\nTo yield obedience in holiness;\nAnd being baptized in His Name,\nUpon His Doctrine to build.\n\nJesus to man is the Way,\nHe is the Life and the Truth;\nHe is Everlasting Father, Divine Love,\nThrough everlasting eternity.\n\nThe day is coming when all people\nShall stand in His presence;\nThe redeemed in His holy Name,\nWith Him forevermore shall reign."
  },
  "73": {
    "title": "We Shall Rejoice Today",
    "lyrics": "We shall rejoice today at this banquet,\nWhich Jesus the Master hath prepared;\nUnto His people whom He hath purchased,\nWith His own blood which He hath shed.\n\nCHORUS: \nBlessedness is found in Jesus,\nRest and security;\nTherefore the people sing to Him,\nUnto Christ praise and honor.\n\nWe shall stand this day triumphantly singing,\nFor our cup is running over;\nFor we behold today at this feast,\nThe presence of the Holy Spirit.\n\nHallelujah, hallelujah to the Lamb,\nHallelujah, hallelujah, hallelujah,\nThe Lamb who hath saved His people\nBy His death which He hath borne."
  },
  "74": {
    "title": "Unto Thee, My Lord",
    "lyrics": "Unto my Lord I yield my soul,\nUnto the Redeemer of goodness;\nThou alone restorest my calm,\nThy sweet truth doth delight my heart.\n\nCHORUS: \nI behold already that blessed day,\nWherein I shall rejoice with my God;\nSinging unto Him songs of gladness,\nRejoicing there in His everlasting love.\n\nAlong the path which Thou hast marked out for us,\nWith Thy blood, torment, and agony,\nThe church Thou hast ransomed journeyeth on,\nUnto the place of Thine eternal Mansion.\n\nA pilgrim upon the earth I wander,\nTill I behold Thee, my faithful Savior;\nWhen all sorrow and suffering\nShall have an end where Thou dwellest, O God."
  },
  "75": {
    "title": "From the East and from the West",
    "lyrics": "From the east and from the west shall come,\nNations that know not the LORD;\nThey shall come and worship the Lord,\nSinging praises unto Him.\n\nCHORUS: \nPeoples whom we know not shall come,\nPeople whom we have never seen;\nFaces we have never beheld,\nWe shall behold praising the LORD.\n\nFrom all continents they shall come,\nAll the chosen of the LORD;\nWho once were dead in their sins,\nToday they bless their Redeemer.\n\nThe Lord spake through His prophets,\nGiving promises ever unto Abraham:\n“I will make of thee a great nation,”\nAnd this is the blessing of the Lord.\n\nAll of us who know our God,\nOught evermore to give Him honor;\nFor in His great and tender favor,\nHe brought us to be a people unto Him."
  },
  "76": {
    "title": "The Tomb Enclosed Him",
    "lyrics": "The tomb enclosed Him,\nChrist, my Christ;\nHe waited there for dawn,\nChrist the Lord.\n\nCHORUS: Christ hath overcome the tomb,\n(Yea, overcame!)\nHe with great power arose;\nOver the sepulchre and death,\nChrist is the conqueror,\nHe liveth forevermore,\nOur blessed Savior.\nGlory to God. . . Glory to God,\nThe Lord is risen!\n\nFrom keepers He broke free,\nChrist, my Christ;\nThe seal He did destroy,\nChrist the Lord.\n\nNow He reigneth,\nChrist, my Christ;\nIn glory and majesty,\nChrist the Lord."
  },
  "77": {
    "title": "A Denarius",
    "lyrics": "A denarius He offered unto me,\nThe Lord who called me,\nThat I might labor in His Vineyard;\nHe spake thus unto me:\n“Stand not here idle; come, I will send thee:\nGo work today in My Vineyard.”\n\nCHORUS: \nTo labor and earn the denarius\nOf the Lord Jesus;\nThe denarius is the life that God giveth:\nYes, Yes, Yes, Yes, we must labor on.\n\nThe denarius which He promised me,\nEven the Lord, I desire;\nFor here below I must earn it;\nIt is the time of the sowing,\nAnd sowers there are none:\nGo work today in My Vineyard.\n\nA denarius shall I earn;\nIt is what the Lord will pay\nTo the laborer of His Vineyard;\nBecause the worth possessed by\nThe denarius of the Lord,\nIs that of Life Eternal.\n\nA denarius from the Lord,\nUnto him that laboreth with love,\nUnto the first and to the last;\nA Divine voice is heard,\nSaying again to thee: “Come and see,\nGo work today in My Vineyard.”"
  },
  "78": {
    "title": "The Lord Jesus Cometh",
    "lyrics": "The Lord Jesus cometh in the clouds,\nUpon His Throne shalt thou behold Him;\nHe cometh surrounded by His holy angels,\nTo raise up those who suffer for Him.\n\nCHORUS: \nOh, what joy to hear\nThe Voice of the King!\nWhen He shall say:\n“Enter, My faithful servant,\nInto the kingdom prepared,”\nWhich is pure love;\n“Enter, My servant,\nInto the rest of thy Lord.”\n\nThat joyful day is drawing near,\nWhen every eye shall behold;\nThat coming of the King of kings,\nWho shall appear with glory and majesty.\n\nAll this flock is arraying herself,\nFor she knoweth what she must do;\nShe must put on her garments of white,\nTo welcome Jesus Christ her King.\n\nIf thou desirest to serve Jesus Christ,\nHe telleth thee what thou must do:\nBehold, He cometh to gather His own,\nAnd to recompense this unfaithful world."
  },
  "79": {
    "title": "The Day Draweth Near",
    "lyrics": "The day is now drawing near,\nOf that which He promised us,\nThat if we be faithful to Him,\nWe shall go to meet Him.\n\nCHORUS: \nHallelujah to the great King who cometh,\nHallelujah to the great King who cometh;\nThe angels who walk in the light do sing\nThe wonders of His love.\n\nThe labor that thou dost,\nChrist will reward thee for;\nWhen He cometh in the clouds,\nInto His Kingdom shalt thou enter.\n\nFight on, then, faithfully,\nFor a reward shalt thou have;\nIn the day of His coming,\nInto His kingdom shalt thou enter.\n\nChrist seeketh the valiant,\nWho look not back;\nWho, though they die in the fray,\nNever deny their God."
  },
  "80": {
    "title": "Give Me a New Heart",
    "lyrics": "Give me a new heart,\nThat will praise Thee night and day;\nGive me a new heart,\nO Jesus, Thou art my guide;\nGive me a new heart,\nAnd let it be Thy dwelling place;\nGive me a new heart,\nGive me a new heart,\nHallelujah!\n\nI desire to love Thee, my Lord,\nFor I am truly thankful;\nSince Thou didst give me salvation,\nAnd it is an unmerited gift.\nThou didst change my heart,\nAnd gavest me new life.\nO what sweet love of God!\nO what sweet love of God!\nHallelujah!\n\nNow am I ready, my Lord,\nTo go forth with the message\nOf peace and of love,\nWhich the souls do need.\nI feel the fire of Thy love,\nAnd the divine presence.\n/:/Now Thy Spirit is in me/:/\nHallelujah!"
  },
  "81": {
    "title": "Firm and Forward",
    "lyrics": "Firm and forward, hosts of faith,\nWithout any fear, for Jesus seeth us;\nSovereign Leader, Christ, goeth at the van,\nNow the royal banner waveth in the field.\n\nCHORUS: Firm and forward, hosts of faith,\nWithout any fear, for Jesus seeth us.\n\nAt the sacred name of our Captain great,\nTrembleth the enemy and fleeth from the fray;\nOurs is the victory, give ye praise to God,\nAnd let hell hear it, filled with dread and awe.\n\nMightily the Church of God is moving on,\nFollowing the steps of the glorious saints;\nWe are but one body, and one is the Lord,\nOne is our blessed hope, and one our fervent love.\n\nThrones and earthly crowns may perish and decay,\nYet the Church of Jesus faithful still shall be;\nNothing formed against her ever shall prevail,\nFor His holy promise faileth nevermore."
  },
  "82": {
    "title": "The Bride Is Arrayed in Splendor",
    "lyrics": "The bride doth array herself in splendor,\nWith gladness also is she adorned;\nFor she is waiting,\nFor the great Savior;\nWho now is seen\nWith wondrous splendor.\n\nCHORUS: \nWatch thou ever, beloved bride,\nWaiting for thy Lord;\nArrayed in holy garments,\nThou shalt fulfill thy faithful mission,\n\nWait thou ever in holiness,\nIn supplications and in prayer;\nAnd at the end of all,\nThou shalt have the crown,\nWith Jesus the Christ\nIn the city of Zion.\n\nEver watchful must we abide,\nWe are the Church of God;\nAnd we ought to be\nAll of us waiting,\nEver awaiting\nOur Redeemer.\n\nThe servant blessed indeed,\nWho faithfully did Thy will;\nMust needs be fulfilled\nIn him Thy promise:\nFaithful in a few things,\nRuler over many things shalt Thou set him."
  },
  "83": {
    "title": "Christ the Savior Cometh",
    "lyrics": "Christ the Savior cometh,\nIn the clouds with power;\nHe cometh to gather up His flock,\nWhich serveth Him with holy love.\n\nCHORUS: The mighty God and powerful King,\nLeadeth us to rest in Him;\nHe shall grant us sweet repose,\nIn the Celestial City.\n\nMany angels also,\nShall lift up voices of praise;\nUnto the glorious Emmanuel,\nJesus Christ the Redeemer.\n\nLift up your voice unto Him,\nYe blessed of the Lord;\nUnto the Guide of Israel,\nBe honor, praise, and glory."
  },
  "84": {
    "title": "This Unfaithful World",
    "lyrics": "This unfaithful world,\nShall save no one;\nCome, friend, unto Christ,\nAnd He shall save thee.\n\nCHORUS: \nChrist shall come again,\nAt the doors is He;\nAnd many shall doubt,\nThat Christ shall come again.\n\nHe shall send to thee,\nThe promise that is found;\nIn Christ my Jesus,\nHe shall send it unto thee.\n\nRevelation chapter seven,\nA prophecy fulfilled;\nUnto every creature,\nWho awaiteth His coming.\n\nSaint Matthew twenty-eight,\nThere is the Commandment;\nActs two thirty-eight,\nIs found the fulfillment.\n\nThe plagues are drawing near,\nSo saith His holy Word;\nIf thou dost not repent,\nDestruction doth await thee.\n\nSaint Mark chapter sixteen,\nSigns shall surely follow;\nIn the Name of Christ,\nThe sick shall be healed.\n\nThe King of glory cometh,\nAnd His angels joined with Him;\nTo gather up His saints,\nWho have truly repented."
  },
  "85": {
    "title": "The Bride of the Lamb",
    "lyrics": "The Bride of the Lamb prepareth herself\nTo meet the Lord,\nHer Bridegroom and Savior;\nHe cometh soon in the clouds\nWith His saints to lift up\nHis Church which He hath bought.\n\nCHORUS This is the church of Jesus Christ,\nWhich was hidden in the wilderness,\nToday she cometh forth radiant;\nAs a mighty army with banners,\nTo meet her Lord,\nWho bought her with His holy love.\n\nWith garments pure and white,\nAnd shining with splendor;\nGod Himself arrayed her,\nIn her spiritual vesture;\nHe sealed her with His Holy Spirit,\nHe shall bring her to His Kingdom to rest.\n\nHe that overcometh shall shine forth\nIn glory,\nAnd as the sun shall he be seen,\nThroughout all eternity;\nAnd the Lord Jesus Christ shall give him,\nLife everlasting, and a crown upon him set.\n\nThe Coming of the Lord draweth near,\nThe Church of Him also,\nIs overflowing with love;\nMay holiness ever be\nHer mighty shield,\nTo dwell in the Great City of Zion."
  },
  "86": {
    "title": "My Master Departed",
    "lyrics": "My Master departed,\nTo a country without compare,\nWhich is far away;\nHe left me a commandment, and to obey\nThe Lord, my duty shall be.\n\nCHORUS: Faithful I would be to Him,\nWhile awaiting His coming;\nIn His service,\nEver steadfast and true;\nFaithful I would be to Him,\nWhithersoever His hand leadeth me,\nUntil I have\nThe joy of beholding His face.\n\nWhite already are the harvest fields,\nAnd the laborers are few;\nTherefore with gladness,\nI straightway accept my place\nAnd my portion.\n\nOthers may go into the vineyard,\nShall I then negligent be?\nTo employ their talents,\nOthers may strive, and shall mine\nBy me be hid?\n\nThe moment draweth near,\nOf His Coming, but when?\nI know it not;\nI only yearn that He may find me\nEver active, fervent, and faithful."
  },
  "87": {
    "title": "Wherewith Shall We Repay",
    "lyrics": "Wherewith shall we repay Thine immense love,\nThat Thou gavest Thy life for the vilest sinner?\nIn return receive this humble offering,\nThis humble offering, Lord Jesus Christ,\nMy faithful heart.\n\nAnd when the night spreadeth out its mantle,\nMine eyes filled with tears upon Thee shall I fix;\nLifting up mine eyes I shall behold the stars,\nI know that beyond them, as a loving Father,\nThou watchest over me.\n\nI cannot repay Thee with silver or gold,\nThe great sacrifice Thou didst make for me;\nI have naught to give Thee for loving me so;\nReceive Thou this song mingled with weeping,\nMy faithful heart."
  },
  "88": {
    "title": "I Have a Shepherd",
    "lyrics": "I have a Shepherd sublime,\nOh, how sweet to sing of His love!\nHis gentle arm redeemeth\nFrom danger the vilest sinner.\n\nCHORUS My good Shepherd, His crook shall guide me,\nMy good Shepherd, with His love shall sustain me,\nMy good Shepherd, naught shall my soul fear,\nThough in the valley of the shadow of death\nI be,\nBe Thou with me and safe I shall be.\n\nI have a Shepherd Who liveth\nIn heaven at the right hand of God;\nHis eye watcheth over my steps,\nAnd He guideth my path in His light.\n\nThe sheep that had gone astray,\nFrom His throne He came down to seek;\nFinding it already lost,\nTo save it, His life He laid down.\n\nIf perchance wandering lost,\nWithout a Shepherd thou livest today, O sinner,\nIf thou wilt hear His loving voice,\nCome, surrender unto Him thy heart."
  },
  "89": {
    "title": "Be on the Alert",
    "lyrics": "Be on the alert, O people\nOf the Lord,\nFor into the world\nAlready are coming\nThose whom Jesus said\nWere to come,\nAnd who in His Name\nShall deceive many.\n\nCHORUS: /:/Watch and pray,\nFor He cometh now/:/\nJesus my King\nVery soon shall return.\n\nKingdoms and nations\nAlready have fought,\nEarthquakes and famines\nAre upon the earth,\nOnly proclaiming\nWhat Jesus hath said,\nThat His Words\nNever shall pass away.\n\nAnd because iniquity\nHath abounded,\nLove shall wax cold,\nAnd chill the hearts of many;\nYet they that endure\nUnto the end,\nThese, saith Jesus,\nShall be saved.\n\nAll of the signs\nAre being fulfilled,\nTo the very letter\nAs they are written;\nAnd all the peoples\nPerplexed do stand,\nOnly saying:\n\"Alas! What shall these things be?\""
  },
  "90": {
    "title": "To Prepare Mansions",
    "lyrics": "To prepare mansions\nThe Savior is gone,\nAnd we, His redeemed people,\nToday give Him praise.\n\nCHORUS: At the. . . :final trumpet:\nThe world shall tremble.\n\nKings and priests\nOur God shall make us,\nAccording as the Lord\nHath promised to His flock.\n\nThe angels of heaven,\nCome with the Lord,\nSinging hallelujahs\nUnto our Savior.\n\nThe streets are of gold,\nAnd the sea is of glass;\nEvery gate is a pearl,\nHow sweet to be there!\n\nIn the streets of gold\nMy Redeemer Jesus\nShineth with His countenance,\nWhich is His divine light.\n\nAnd when a thousand years\nWe reign with Jesus,\nWe shall live forever\nIn His divine light."
  },
  "91": {
    "title": "With Tender Voice",
    "lyrics": "With tender voice Jesus calleth thee,\nAn invitation of purest love;\nWhy dost thou leave Him to call in vain?\nWilt thou be deaf, O sinner?\n\nCHORUS: Today He inviteth thee,\nToday He inviteth thee,\nO blessed voice,\nTenderly, He inviteth thee today.\n\nUnto the weary Jesus extendeth His call,\nWith compassion He beholdeth their grief;\nBring Him thy burden, He shall bless thee,\nThe Lord shall surely help thee.\n\nEver waiting, behold Jesus,\nSo long waiting with such great love;\nCome, tarry not, O vile sinner,\nOpen today thy heart."
  },
  "92": {
    "title": "Thou, Chosen from Among the Peoples",
    "lyrics": "Thou, chosen from among the peoples,\nAnd dearly favored unto God;\nWe ought to bless the Lord of heaven,\nWho shieldeth us with His love.\n\nCHORUS: For with a seal thou art sealed,\nAnd with a mark thou art marked,\nUpon thine heart,\nUnto the day of redemption.\n\nBride of my Savior,\nThou dost rejoice in His holy love;\nHe leadeth thee guided by His hand,\nUntil He bringeth thee to His mansion.\n\nBlessed be the Holy Lamb,\nWho redeemeth us by His love;\nHe shall lead us in His path,\nAnd granteth us His favor."
  },
  "93": {
    "title": "From Heaven an Angel Shall Come",
    "lyrics": "From heaven an angel shall come,\nAnd in the air his voice shall be heard,\nProclaiming that Christ shall come,\nHe cometh to lift up His people.\nCome, descend, O Heavenly Lord,\nFor Thou art real indeed;\nWe must adore Thee,\nIn spirit and in truth.\n\nCHORUS: We await Thee, O Lord!\nThat Thou wouldst come to bear us away,\nTo Thy Kingdom to rest,\nForever in that home;\nWe await Thee, O Lord!\nThat Thou wouldst come to bear us away;\nWe must adore Thee,\nIn spirit and in truth.\n\nHow joyful that moment shall be,\nHow many voices of \"Glory to God!\" shall be heard,\nAnd he that calleth on Jesus shall live,\nAnd upon his forehead His name he shall bear.\nWhat must we all do?\nBy faith in the Lord to trust;\nWe must adore Thee,\nIn spirit and in truth.\n\nWe shall pray to the God of Israel,\nAnd of Isaac, and also of Abraham,\nThat we may attain unto that place,\nWhere the Heavenly Father doth dwell.\nIn patience we must abide,\nWaiting for the end;\nWe must adore Thee,\nIn spirit and in truth.\n\nHoly, holy, holy shall be said,\nWith one voice we shall say without ceasing:\nGlory, glory, glory, hallelujah,\nHallelujah, hallelujah to Jehovah,\nHallelujah, hallelujah to the Lord,\nWho hath given us assurance;\nWe must adore Thee,\nIn spirit and in truth."
  },
  "94": {
    "title": "Soon He Shall Appear",
    "lyrics": "Soon He shall appear and tarrieth not,\nHe that helpeth thee to overcome\nThe tempest.\n\nCHORUS: Thanks be to my God that until this day,\nThou hast extended Thy favor unto me;\nThou keepest me in Thy fold,\n. . .By Thy goodness. . .\nHonor and praise my soul shall give Thee.\n\nHeaven and earth shall tremble,\nAt His power;\nWhen He cometh to judge,\nThe righteous Judge.\n\nGird now thy loins with holiness,\nThat thou mayest have entrance into the city.\n\nOnly the righteous shall dwell\nWith our King,\nYonder in the holy city,\nForever, Amen."
  },
  "95": {
    "title": "Now Dawns the Glorious Day",
    "lyrics": "Now dawns the glorious day,\nWhen Christ shall reign,\nIn His wondrous kingdom;\nPeace and righteousness shall flourish.\n\nCHORUS: \nJesus Christ suffered\nShame and humiliation;\nAnd upon a rugged cross He died\nFor our redemption;\nArrayed today\nWith His power and majesty,\nAll peoples He shall rule\nWith all authority.\nNo longer shall He be a lamb,\nPatiently to suffer;\nHe is the Lion of Judah,\nWho shall reign forevermore;\n\"Glory to King Jesus!\"\nAll His flock shall sing,\nNations and peoples shall render\nTribute unto Christ the King.\n\nValleys, mountains, and meadows,\nCast off now your slumber;\nYour true blessedness,\nWith His Kingdom the Lord doth bring.\n\nIn the radiance of His glory,\nThe nations shall walk;\nWars, famines, and sorrows\nForevermore shall cease.\n\nFor wonders without compare,\nWe give glory and praise;\nFor the kingdoms of this world\nShall be the kingdoms of our Lord."
  },
  "96": {
    "title": "How Tenderly",
    "lyrics": "How tenderly He is calling you,\nO sinners, come;\nHe waiteth for you with open arms,\nHe is calling unto thee.\n\nCHORUS: Come ye, come ye,\nIf ye are weary, come;\nHow tenderly He is calling us,\nO sinners, come.\n\nAnd why dost thou fear, if He is pleading,\nEven Christ, for thee and for me?\nHis blessings He is ever pouring out,\nFor thee and for me.\n\nTime is fleeting, 'tis meet to seize it,\nChrist is calling unto thee;\nDo not despise Him, turn unto Christ,\nBehold, He died for thee."
  },
  "97": {
    "title": "When My Lord Shall Come",
    "lyrics": "When my Lord shall come, I would await Him,\nWith my lamp burning bright with light and peace;\nAt the doors is He, of this I am sure,\nI know I must prepare, for He cometh now,\nAnd He tarrieth not to arrive.\n\nCHORUS\nVery soon cometh my Lord, full of Glory,\nHe cometh to the earth, and tarrieth not;\nHe cometh to take His faithful and holy Church,\nThe Church of the Living God, Christ shall raise her up.\n\nWhen my Lord shall come upon the clouds,\nWith His angels He shall come, I will await Him;\nHe ever saith unto me thus: that I be watching,\nAnd also that I be praying,\nTo take me unto His celestial Mansion.\n\nWhen my Lord shall come, what great rejoicing!\nFor He cometh to bear away His holy flock;\nI do not wish to remain in this world,\nI desire to follow Christ unto His kingdom,\nAnd with Him I shall be blessed.\n\nWhen my Lord shall come, I would await Him,\nEver doing thus: His holy will;\nAnd so shall He bring me unto His mansions,\nUnto me it shall be bliss to reign with Christ,\nThroughout all eternity."
  },
  "98": {
    "title": "I Shall Go with My King",
    "lyrics": "I shall go with my King and Lord,\nTo enjoy His eternal Mansion;\nAnd there I shall sing with love,\nFor He hath set me free.\n\nCHORUS: I shall go with Jesus my Lord,\nI shall go to His royal Mansion;\nMy delight and my joy shall be,\nTo bless and to praise my King.\n\nI shall stand at the throne of light,\nAnd shall behold my King and Lord,\nWith His angels round about Him,\nRendering unto Him praise.\n\nIn the clouds my Lord shall come,\nTo take His people that is faithful;\nI shall be part of this blessed flock,\nTo abide with my great King."
  },
  "99": {
    "title": "Yonder in the Mansion",
    "lyrics": "Yonder in the mansion,\nWhere my King is found,\nI hope to arrive,\nAnd sing praises unto Him.\n\nCHORUS: O city! The most fair,\nThou that showest thyself most glorious;\nAwaiting the arrival,\nOf the Church most beloved.\n\nMy joy is to behold\nThe wondrous works of God;\nAnd greater joy shall be,\nTo dwell in that City.\n\nYonder in the Mansion,\nPeace and love do reign,\nThere is no sorrow there;\nOnly the glory of God doth reign."
  },
  "100": {
    "title": "Comfort Ye, Comfort Ye",
    "lyrics": "Comfort ye, comfort ye,\nO people of Mine!\nFor thy sin and transgression\nIs pardoned now,\nAll is blotted out, saith Jehovah.\n\nCHORUS: \nBy Jesus we are cleansed,\nBy Him we are washed;\nBy Jesus Christ the King,\nWe are sanctified,\nFor thus hath He left written,\nThe Lamb that was slain:\n\"Now ye are clean\nThrough the Word which I have spoken unto you.\"\n\nThe Church of Jesus Christ\nWas comforted,\nBy Christ the Good Shepherd;\nOur Deliverer,\nHe hath purchased us with His grief.\n\nJesus Christ, speaking, said:\n\"I will not leave you comfortless,\nI go unto Him that sent Me;\nAnd ye shall abide in My love,\nAnd I will send you My Comforter.\"\n\nWe who extol His Name\nAre washed\nAnd confirmed now,\nBy Christ the Savior;\nHe hath sealed us,\nGlory to the Lord!"
  },
  "101": {
    "title": "Mine Eyes Look Unto God",
    "lyrics": "Mine eyes look unto God\nWhen in distress I cry,\nAnd He giveth me answer,\nWhithersoever I go.\n\nCHORUS\n\"Call upon Me in the day of trouble,\"\nSaith the Lord Jehovah;\nHe heareth them that seek Him,\nAnd He will answer us.\n\nI lifted mine eyes unto God,\nBeing in affliction;\nAnd the Lord answered me,\nGiving me consolation.\n\nThey that trust in Jehovah\nShall have no sorrow:\nFor the Lamb of God\nShall bear them unto heaven.\n\nAnd when we are yonder,\nWith Christ the Saviour;\nHymns and songs of honour,\nWith joy we shall sing."
  },
  "102": {
    "title": "The Life That I Have",
    "lyrics": "The life that I possess,\nI owe unto the Saviour;\nFor through many a conflict,\nHe maketh me victorious.\n\nCHORUS:\n//:Jesus, Master,\nHave mercy upon me;\nUphold me with Thy hand,\nAnd my life I yield to Thee: //\n\nThe conflicts now draw near,\nI must overcome them all,\nFor trusting in Christ Jesus,\nHis power doth succour me.\n\nMy soul is fully ready\nTo fight forevermore;\nI know that Jesus Christ\nA crown to me shall give.\n\nI have the blessed hope,\nThat I must overcome,\nAn unfading crown,\nMine eyes desire to see."
  },
  "103": {
    "title": "A Hope Now Reigneth",
    "lyrics": "A hope now reigneth within my being,\nSince I came forth out of darkness;\nI wandered aimless and without direction,\nYet Christ unto my soul gave salvation.\n\nCHORUS:\nSalvation is in Jesus,\nDoubt no more His power;\nCome then to Him without delay,\nSurrender thy heart unto Him.\n\nI am a witness of the power of God,\nMany miracles He hath wrought in me;\nOnce blind, but now I see the light,\nThe heavenly light, which is Jesus.\n\nChrist hath already paid all on the cross,\nA sacrifice He made for thee and for me;\nIt only remaineth that thou come to God's fold,\nRepentant now of every evil.\n\nLost souls, wander no more,\nCome unto Christ, and He will grant you pardon;\nForsake the world and vanity,\nFor Christ alone giveth you salvation."
  },
  "104": {
    "title": "Because He Lives",
    "lyrics": "God sent to us His Son, beloved,\nHe is healing, peace, and pardon;\nHe came to die, He paid my debt,\nAnd though He died, His tomb\nAlready empty is.\n\n1st CHORUS:\nHe lives today, He will live tomorrow;\nI trust in Him, I will not fear,\nFor my future now is secure,\nLife is well worth the living\nFor He lives in me.\n\nSweet 'tis to know that Jesus Christ\nRedeemed me and saved me;\nTherefore to Him I give the glory,\nGlory, Hallelujah, glory,\nFor He is alive.\n\n2nd CHORUS:\nBecause He lives, I shall triumph tomorrow,\nBecause He lives, there is no fear,\nBecause I know that the future is His,\nLife is worth more and more only through Him.\n\nI know that one day I shall behold Christ,\nWith great power He shall come again;\nHe will take me to His mansions,\nWhere forever I shall reign,\nWith my Lord."
  },
  "105": {
    "title": "Brethren, with Joy We Meet",
    "lyrics": "Brethren, with joy we meet together,\nIn time that swift doth fly;\nYet ever cometh\nThe sorrowful hour\nWherein we say... Farewell!\n\nCHORUS:\nNever is said... Farewell up there;\nNever is said... Farewell\nIn the fair land of joy and peace,\nNever is said farewell.\n\nHow sweet the consolation given\nBy them as they depart:\nThat when Jesus comes in glory,\nWe shall be gathered together.\n\nThe voice of sorrowful parting\nShall never there be heard;\nBut the song of peace and gladness\nForevermore shall endure."
  },
  "106": {
    "title": "There I Long to Be",
    "lyrics": "I hear it told that far beyond there is a blessed place,\nWhere the soul forevermore may abide;\nWhere death shall never enter, nevermore,\nBut yonder with the Lord all is solace and rest.\n\nCHORUS: There I long to be, there I long to be,\nTo see Jesus my Saviour and with Him to dwell;\nThere I long to be, there I long to be,\nAnd praises unto Jesus there to raise.\n\nI cannot cease to proclaim that Jesus saves;\nHe bringeth the lost from the night into His marvellous light;\nCalm He will give to the pilgrim in the storm;\nSongs for mourning He will give in His great lovingkindness.\n\nI go so gladly amidst trials here below,\nBecause I know that I shall see Christ yonder;\nWhere through ages and ages in endless glory,\nPraises I will give to God with harp and with trumpet."
  },
  "107": {
    "title": "Rejoice, Ye That Are in the Lord",
    "lyrics": "Rejoice, ye that are in the Lord,\nLet us march after Him,\nServing Him with faithfulness;\n/:/Until we reach Zion/:/\n\nCHORUS: To Zion, to Zion,\nWe are marching on;\nUnto that city of gladness,\nWhere Jehovah doth dwell.\n\nTake heart and march on without fear,\nLeaving distress and every care;\nLooking not to the right, but unto Him,\n/:/Until we reach Zion/:/\n\nFear ye no more, Christ goeth before us,\nHe will deliver us fully from evil,\nFor He is our Captain,\n/:/Until we reach Zion/:/\n\nFear ye no more, Christ goeth before us,\nHe will deliver us fully from evil,\nFor He is our Captain,\n/:/Until we reach Zion/:/"
  },
  "108": {
    "title": "To Canaan We Are Marching",
    "lyrics": "To Canaan we are marching on,\nAnd the great Jehovah guides us;\nIn the barren wilderness,\nEver by our side He stands.\nAmid darkness and in dangers,\nWe have naught to fear:\n'Tis Jesus who doth lead us,\nTo follow Him is our duty.\n\nCHORUS: We go to Canaan, beauteous land where milk and honey flow;\nWe go to Canaan, led by Christ, we who are of His flock.\nWe go to Canaan, precious land, of Jehovah faithful promise,\nWe go to Canaan, we go with Christ, our Guide and our King.\n\nNow we journey through the desert,\nAnd from heaven falls the manna;\nDivine light shineth upon us,\nWe are the people of Jehovah.\nFrom the smitten Rock there gusheth\nA spring of living water;\nOur thirst is quenched there,\nAnd our affliction ends.\n\nThrough the barren wilderness,\nUnto the land of Promise,\nWhere milk and honey flow,\nAbundant provision.\nThrough the barren wilderness,\nNear is our strand;\nBeyond Jordan our mansions\nForever shall remain."
  },
  "109": {
    "title": "I Am Journeying Now",
    "lyrics": "I am journeying now,\nUnto the heavenly home;\nTo enjoy yonder\nA bliss beyond compare.\nThrough the desert\nIs the way wherein I walk;\nIllumining my path\nIs the light of Christ the Saviour.\n\nCHORUS: Therefore there is great joy\nAmong the people of the Lord;\nAs they journey onward,\nUnto the city of Zion,\nThere shall be wiped away\nEvery tear and sorrow;\nAnd I shall live forever\nWith Christ my Lord.\n\nMy steps are guided\nBy Jesus Christ, the King of Zion,\nUntil I reach Him,\nAnd behold His face yonder;\nThis is the joy of him that seeketh\nHis Lord;\nTo keep himself ever\nIn holiness and love.\n\nThrough the desert I go,\nThe Angel of the Lord guardeth me;\nThe refulgent light\nLeadeth and guideth me to that place;\nThis is the King of kings,\nMy Lord;\nHe who helpeth me\nTo overcome temptation."
  },
  "110": {
    "title": "We Have a Lord",
    "lyrics": "We have a Lord\nWho knoweth how to comfort;\nJesus the Redeemer,\nThe Heavenly Father.\nHaving our heart\nPrepared for Him;\n//: We conquer temptation,\nWe conquer with power: //\n\nCHORUS: Lord of heaven, earth, and sea,\nTo live and rejoice believing in Thee\nIs my spiritual delight;\nTo sing, saying ever thus:\nJesus, the Good Shepherd,\nIs my helper.\n\nMy joy is to behold\nThe work of the Creator;\nHe brought peace to my soul,\nBlessed be the King of Zion.\nThe God of lovingkindness\nSaw me in my conflict;\n//:As I wandered in evil,\nHe came to set me free://\n\nWe must fight\nWith weapons of truth;\nWe must triumph\nThrough Christ our Captain.\nNourished by faith,\nThe children of Jehovah;\n//:Go swiftly to conquer,\nWorking in holiness.://"
  },
  "111": {
    "title": "How Great Thou Art",
    "lyrics": "O Lord my God, when I behold the heavens,\nThe firmament, and stars in thousands bright,\nWhen hearing Thy voice in the mighty thunder,\nAnd seeing the sun shining in its zenith.\n\nCHORUS: My heart doth raise this song of praise:\nHow great is He, how great is He!\nMy heart doth raise this song of praise:\nHow great is He, how great is He!\n\nWhen roaming through the mountains and the valleys,\nAnd seeing the fair flowers as I pass,\nWhen listening to the singing of the birds,\nAnd the murmuring of the clear mountain spring.\n\nWhen I recall that love divine from heaven,\nWhich from on high the blessed Saviour sent;\nThat Jesus who to save me came to earth,\nUpon a cross suffered for me and died.\n\nWhen the Lord shall call me to His presence,\nTo the sweet home, to heaven of splendour bright,\nI shall adore Him, singing of the greatness\nOf His power and His infinite love."
  },
  "112": {
    "title": "One Day Ere Long",
    "lyrics": "One day ere long I shall be\nWith my great King;\nAnd there I will sing unto Him:\n/: O happy day/:/\nWherein I shall rejoice.\n\nCHORUS: O day of splendour,\nO day of rejoicing;\nTo be with the King of kings,\nSinging songs of praise.\n\nO day, great day wherein I shall behold\nMy great King;\nIn great splendour of light,\n/: O happy day: /\nWherein I shall rejoice.\n\nBlessed be the day wherein shall come\nThe King of Zion;\nSeated in His majesty.\n/: O happy day: /\nWherein I shall see Him.\n\nI await that day wherein shall come\nMy Redeemer;\nThere sorrow shall cease,\nAnd grief and every care,\nWith Christ the Lord."
  },
  "113": {
    "title": "Zion, Celestial City",
    "lyrics": "Zion, celestial City,\nThere I hope to dwell;\nZion, my soul doth long for thee,\nWhere I may ever behold\nThe holy face of God.\n\nI grow weary in the desert,\nI am even ready to faint;\nYet the Lamb of God\nHastens to save my soul.\nSwiftly He comes in my favour\nAnd calms my conflict;\nAnd so I continue journeying\nUnto the celestial City.\n\nZion, City of truth,\nI long to behold thee;\nZion, City of the beloved Son,\nWho was crucified\nFor my liberty.\n\nZion, beyond the sun,\nMy soul shall gaze upon thee;\nZion, City of promise,\nWhich Christ the Saviour\nWent to prepare for us."
  },
  "114": {
    "title": "I Know the Father Knoweth, Yea",
    "lyrics": "I know the Father knoweth, yea,\nThe struggles that come upon me;\nYet He is able to take them away,\nMy night He will turn into day.\n\nCHORUS: He sees, He sees, my Father sees\nThe winds that beat against my soul;\nHe sees, He sees,\nAnd calms them with His mighty power.\n\nI know the Father knoweth, yea,\nThe balm for all my suffering;\nAnd with a touch of His dear love,\nHe will heal my broken heart.\n\nI know the Father knoweth, yea,\nHow weak I am in the battle;\nHe will stay mine enemies,\nAnd He will ever defend me.\n\nI know the Father knoweth, yea,\nThe end of my departure here;\nGrant unto me, O faithful Guide,\nThat by Thy side I may be found,"
  },
  "115": {
    "title": "Come Unto Me, My Lord Jesus",
    "lyrics": "Come unto me, my Lord Jesus,\nTo deposit within my heart\nThis heavenly feast\nWhich is of purest love.\n\nCHORUS: The hope that I have\nShall not depart:\nTo serve the most high God\nThroughout all eternity.\n\nIn Thy mansion I shall dwell,\nIf I am faithful here within Thy fold;\nI shall ever abide\nWith Thee, my King.\n\nMy good Lord, it shall not depart\nFrom out my heart, this great love\nWhich Thou hast placed within me,\nMy blessed Saviour."
  },
  "116": {
    "title": "My Song",
    "lyrics": "When the angels hear my song,\nAnd my voice uniteth then with the choir of God,\n/: My singing shall be transformed,\nAnd from the multitude only this shall be heard: /\nHoly, holy, holy, unto the sovereign Lord.\n\nWhen in heaven they hear my joyful song,\nGrief, anguish, sorrow, and tribulation past,\n/: As the trumpet doth sound in Zion,\nWhen pain is ended, only this shall be heard: /\nHoly, holy, holy, unto the sovereign Lord.\n\nWhen in heaven I behold Christ the Saviour,\nHe cometh now to the world, He cometh with glory again,\n/: My song shall then be fulfilled,\nAnd among the multitude only this shall be heard: /\nHoly, holy, holy unto the sovereign Lord."
  },
  "117": {
    "title": "When This Life Is Ended",
    "lyrics": "When this life is ended,\nAnd to be forevermore\nFree from all distress,\nAnd without any grief;\nEnjoying His blessed presence,\nOh, how happy I shall be,\nBeholding the precious Homeland,\nAnd Jesus, my Lord and King.\n\nCHORUS: Glory! Oh, what will it be,\nWhen I meet Him face to face!\nWhen He shall say to me,\n\"Enter, My servant faithful.\"\nAnd through ages without end,\nUnto all eternity,\nWe shall live in sweetest comfort,\nYonder with Him.\n\nI know that happy we shall be,\nBeholding His sweet face,\nWhen we dwell with Him at last\nIn fullness of peace.\nNo more tempted shall we be,\nThroughout all eternity,\nSince we have yielded ourselves\nUnto Him who shall care for us.\n\nChrist is my sweet, blessed hope,\nEver since I was saved;\nHe is my life eternal,\nI know to glory I go.\nWhen I am gathered with Christ,\nEndless joy shall be there;\nFor neither sorrow nor death\nShall ever enter therein.\n\nSuch sweetness I now enjoy,\nEver since I was saved;\nHoney unto my mouth is Christ,\nI know to glory I go.\nTherefore press onward I will,\nWith my blessed Saviour;\nHe is my peace and my refuge,\nHe is my faithful Shepherd."
  },
  "118": {
    "title": "Blessed Be Jehovah",
    "lyrics": "Blessed be Jehovah my Rock,\nWho teacheth my hands to the battle,\nAnd maketh me a conqueror;\nAnd therefore with love I give Him praise.\n\nCHORUS: Glorified be\nThe Holy One of Israel,\nHallelujah to the faithful Lamb\nUnto all eternity.\n\nI feel glad and very joyful\nTo see myself gathered among the saints\nWho sing unto Him with fervour;\nAnd therefore with love I give Him praise.\n\nThis banquet which mine eyes behold\nMoveth my weary spirit,\nGiving me spiritual strength\nEver to walk with my Lord."
  },
  "119": {
    "title": "Before Thou Art Baptized",
    "lyrics": "Before that thou art baptized,\nConsider what thou art about to do;\nThou shalt seal an everlasting covenant\nBefore the most righteous Judge.\nUnto no man of this world\nShalt thou pledge thy vow;\n'Tis with the Maker of all the earth,\nWith Jesus Christ the King.\n\nCHORUS: Much shalt thou have to suffer\nFor the name of Jesus;\nThey will call thee a Protestant\nBecause thou hast turned from evil.\nAnd thou, instead of being dismayed,\nCry swiftly to the Good Shepherd;\nThou shalt receive in that moment\nThe help of the Saviour.\n\nHe in His love doth offer His glory,\nIf only thou truly repent;\nTurn from loving what the world doth offer,\nRepent not with lips alone.\nLeave far behind all hypocrisy,\nCleanse thou thy heart within,\nThat Christ may turn away from thee\nDestruction and grim death.\n\nLove not anything of this world,\nFor all of it shall pass away;\nIn that day of the end of the world,\nNot one stone shall remain.\nOnly the faithful that obey Him,\nAnd have done His holy will,\nShall go with Christ to live in glory\nThroughout all eternity."
  },
  "120": {
    "title": "I Bring My Life to Thee, Lord",
    "lyrics": "I bring my life to Thee, my Lord,\nThat it may live in Thy holy truth;\nI bring my soul and body, Lord,\nThat Thou mayest do in me Thy will.\n\nCHORUS: Take Thou my being, Lord,\nTake it from this day forth;\nFill Thou my longing heart\nWith Thy love divine.\n\nI would love Thee and serve Thee, Lord,\nWith all my soul and with all my heart;\nEven as Thou saidst, divine Lord:\n\"He that loveth Me shall be in My mansion.\"\n\nNearer, still nearer to Thee would I be,\nNearer, still nearer for eternity;\nThat I may gaze upon Thy holy face,\nGlorified by Thy wondrous power.\n\nO Father eternal and holy Lord!\nI pray Thee to hear this humble plea:\nThat when Thou comest for Thy faithful people,\nI may be part of that holy flock."
  },
  "121": {
    "title": "I Am Happy",
    "lyrics": "I am happy, I am happy since I have found\nSalvation in Christ with love,\nThe Lord hath shown unto me truth and life,\nI am happy, I am happy;\nEver shall I sing, with joy unspeakable,\nAnd indestructible, I have perfect peace\nAnd ever am I happy.\n\nCHORUS: /:/Christ, my Christ\nIs my Shepherd and my friend;\nChrist, my Christ,\nMy blessed Savior.\n\nI am happy, I am happy\nIn my Christ I have my riches.\nIn my Savior, my Shepherd\nHis life He gave for me.\nThe Good Shepherd, my God\nHe suffered torment and pain\nTo give unto me life the holy\nLamb was offered as a whole burnt offering\nGlory unto Him.\n\nI am happy, I am happy\nBecause Christ loveth me with tenderness\nBecause I am His, and with Him\nI am destined to reign.\nIf I am faithful to the King my Lord.\nBecause He saved me\nFrom the deceitful, perverse, and\nFalse world, which drew my soul away from my\nSavior."
  },
  "122": {
    "title": "Pilgrims in the Desert",
    "lyrics": "Pilgrimaging in the desert.\nThe people of Israel walk;\nUnto the promised land,\nWhere milk and honey flow,\nUnto great Jerusalem.\n\nCHORUS: O Israel in the spirit,\nBless thou thy Creator;\nIt is Jesus Christ the Redeemer,\nHe shall lead thee to His Mansion.\n\nWith bread from heaven He feedeth them,\nTheir thirst they quench at Horeb;\nFrom the rock the water floweth,\nWhich sustaineth those souls,\nShepherded by Moses.\n\nTheir garments made white\nThere upon Mount Sinai;\nWaiting for the third day,\nThe coming of the King of Heaven,\nHe who shall come again."
  },
  "123": {
    "title": "Toward the Highest Rock",
    "lyrics": "Toward the highest Rock\nI am walking,\nAnd without any fear I am advancing.\nFor 'tis Jesus who my steps\nIs guiding, and He shall lead me\nUnto the Heavenly Father.\n\nCHORUS: Christ is my guide,\nHe is my strength and light.\nI will not fear the enemy of my soul.\nFor with Christ I am walking,\nToward the Rock of eternity.\n\nThe tempest now cometh\nAlready it beateth,\nAnd it shall sweep away the mighty\nOf this world;\nBut me it shall never sweep away,\nBecause Jesus Christ will uphold me."
  },
  "124": {
    "title": "I Will Shine for Jesus",
    "lyrics": "I will shine for Jesus the Master,\nProclaiming the peace of the Lord;\nAnd showing forth my good testimony,\nO what joy it shall be unto me!\n\nCHORUS: I will shine for Jesus,\nI will walk in holiness;\nAnd I will hold fast the truth,\nAnd my soul shall have life.\n\nI will shine forever in the world,\nWith the light that the Lord gave to me;\nGiving example unto all people;\nO what joy it shall be unto me!\n\nMy duty as every true Christian,\nIs to shine in my manner of speech;\nIn my upright conversations,\nEver making the Truth to shine.\n\nUnto us is given a linen garment,\nFine linen shining of God;\nTo be present at the Marriage of the Kingdom\nWhere shineth the light of the Creator."
  },
  "125": {
    "title": "Now Joyfully Resounds the Song",
    "lyrics": "Now joyfully resounds the song,\nHoliness forevermore;\nIt announces unto us full salvation\nHoliness forevermore.\n\nCHORUS: Holiness forevermore,\nHoliness forevermore;\nLet us all praise the King of Glory\nHoliness forevermore.\n\nFrom inborn sin He cleansed us,\nHoliness forevermore;\nWith His perfect love He filled us,\nHoliness forevermore.\n\nWe shall faithfully lift up the banner,\nHoliness forevermore;\nWe shall fight without hesitation,\nHoliness forevermore.\n\nLet us give praises unto the Lord.\nHoliness forevermore,\nLet us all sing unto the Lord\nHoliness forevermore."
  },
  "126": {
    "title": "When My God Delivered",
    "lyrics": "When my God delivered\nThe people of Israel,\nWith a strong arm He guided them\nUntil they reached Canaan.\nThere He gave them possession where they might dwell\nThe people rebelled and went after\nGods which they had not known.\n\nCHORUS: Great and glorious is Jehovah\nAnd compassionate in love,\nFor He came to deliver us\nFrom the bondage of King Pharaoh,\nOn Mount Sinai, there His glory was seen;\nThere He delivered to Moses two tables written\nWith His holy law.\n\nMoses being so patient to what God commanded him\nHe fell upon his face, and a sign He showed him,\nHe said to him: Strike the rock with the rod which He gave him;\nSuddenly the water burst forth, the water\nOf life that the people drank.\n\nA curse was the sentence\nUnto him who transgressed the Law\nBut mercy was born,\nIt was born for our good.\nThis was Christ the Blessed,\nBorn of a woman,\nWho came to save the souls\nThat were under the curse\nAccording to the Law.\n\nWhen by day they journeyed,\nA cloud covered them,\nWhen by night they walked,\nA pillar of fire gave light\nThey were exceedingly glad,\nBecause Jehovah preserved them;\nForty years they walked\nAnd their raiment waxed not old."
  },
  "127": {
    "title": "In This Life We Await the Victory",
    "lyrics": "In this life we await the victory,\nWhich the Lord, He Himself shall give unto us;\nThereafter we shall go to be with Him in glory\nWhere eternal liberty is enjoyed.\n\nCHORUS: Hallelujah, hallelujah, hallelujah!\nHallelujah, hallelujah unto the Lord!;\nHallelujah, hallelujah, hallelujah!\nHe delivers us from the tempter.\n\nMany mansions Jesus hath promised,\nOf which He said He went to prepare for us,\nLeaving these present things forever forgotten,\nNevermore shall we remember them.\n\nA thousand years, saith He, peace shall be abundant,\nUnto him who hath received free salvation;\nHis song shall ever say that he was triumphant,\nThat he was delivered from eternal perdition.\n\nWhite raiment, also crown and palm,\nOne by one at last each shall receive;\nThe Eternal Life that God giveth to the soul,\nThis promise shall never fail."
  },
  "128": {
    "title": "Fight Faithfully for the Work of Christ",
    "lyrics": "Fight faithfully for the work of Christ,\nSuffer no more sin within thee;\nConsider the labor of Christ.\nExamine thyself well to follow on.\n\nCHORUS: Today is the time that thou must cleanse\nAll thy heart and thy being as well;\nTo abide in the presence of the Lord;\nStanding upright, awaiting thy redemption.\n\nThe baptism which thou didst receive,\nWas in the name of Jesus Christ the King;\nAll thy sins being forgiven,\nBecause thou wast obedient to the Savior.\n\nJesus Christ continueth calling thee,\nHearken then to His voice, He is thy Savior;\nTo give thee rest at His side,\nAnd deliver thee from all perdition.\n\nSlumber not, beloved brother,\nWatch faithfully for thyself, with patience and faith,\nDespise not the voice that calleth thee\nWith constancy unto the Heavenly Throne."
  },
  "129": {
    "title": "Faint Not, Take Courage",
    "lyrics": "Faint not, take courage now,\nGod shall care for thee;\nIn danger's hour the Shepherd true,\nHe shall care for thee.\n\nCHORUS: God shall care for thee\nNight and day through all thy life;\nHe shall care for thee\nGod shall care for thee.\n\nCast thy burden on the Lord,\nHe shall care for thee;\nOf all companions He is the best,\nGod shall care for thee;\n\nNaught with Christ shalt ever fail,\nHe shall care for thee;\nHe hath said He never will leave thee\nHe shall care for thee."
  },
  "130": {
    "title": "I Follow Christ",
    "lyrics": "I follow Christ, He is my way\nI follow Him through lands, the valleys, and the sea\nJesus doth promise never to leave me,\nA divine promise that shall not fail.\n\nCHORUS: /:/Christ is the light/:/\nLight that floodeth all my being;\nHallelujah! I rejoice\nSinging praises unto my Jesus.\n\nThe shadows that dwell or clouds that pass by\nNever my guide shall be able to hide;\nChrist is pure light, without any shadow\nEver at His side, I shall follow on.\n\nEver in the light, I rejoice\nI press forward, unto my home;\nI walk onward with joy singing\nI walk in the Light, which I shall ever love."
  },
  "131": {
    "title": "Unto the Battle, Brethren Mine",
    "lyrics": "Unto the battle, brethren mine\nWithout ceasing let us march\nChrist is our Leader\nNever shall we turn back.\nFor our Master\nThe victory shall give unto us,\nBeing faithful unto the end.\n\nCHORUS: March on, march on, fighting\nEven unto death,\nFor Christ the King\nGoeth by our side;\nFight on, fight on,\nTill the triumph be won,\nYea, hear the trumpet's sound.\n\nThere will be trials, there will be strivings\nAnd foes a thousandfold,\nYet if we are faithful\nWe shall all overcome.\nLet us follow Jesus, He\nIs our Savior;\nUnto victory He will lead us.\n\nO ye soldiers of the Master!\nWho are in the fray,\nBe ye valiant evermore\nIn the hard-fought strife;\nFor Jesus the Captain\nGoeth by our side,\nThe crown He will give us."
  },
  "132": {
    "title": "I Know That Jesus Came to Save Me",
    "lyrics": "I know that Jesus came to save me\nBecause He already died on the cross;\nAnd if thou also yield thyself to Him\nThen shalt thou be glad.\n\nCHORUS: O rebellious people, how long\nWill ye halt\nBetween two opinions?\nIf Baal be thy god,\nGo ye after him;\nYet if it be Jehovah of heaven\nFollow Him.\n\nI cannot go\nAfter another god\nFor mighty and jealous\nIs Jehovah,\nHe hath made me see\nThat beside Him,\nThere is none else that can save us:\n\nBeloved Lord! Hearken to my voice,\nInasmuch as Thou art pure love;\nTruly, if I believe,\nThou wilt take me away,\nTo the glory of Heaven where Thou art.\n\nTherefore do I here,\nFind myself glad;\nKeeping Thy statutes, O God!\nTruly, my Jesus, Thou art\nThe Light, and now only do I feel\nThy love."
  },
  "133": {
    "title": "As the Ark of Noah",
    "lyrics": "As the ark of Noah upon the waters,\nMoved with the blowing of the winds;\nThose who within it were found full of gladness\nBlessed the name of Jehovah\nAnd like them let us give glory,\nUnto the Author of our salvation,\nAnd with great devotion let us build,\nAn altar unto God within our heart.\n\nCHORUS: How beautiful is the power of Christ!\nHow beautiful is perfect love!\nBrother, now the ark is,\nChrist my Savior!\n\nLet us proclaim like Noah to the multitudes,\nAnnouncing the counsel of Jehovah,\nThat He shall come with great power on the clouds,\nTo judge this world of wickedness, .\nFor the ark is already prepared,\nWhere the people of Jehovah are\nIn a moment it must be lifted up\nAnd with glory in the clouds it shall appear.\n\nThe Pilot is already within the ship,\nInviting those who remain outside,\nEre it be too late,\nAnd the people run to and fro.\nThe sounding signal announces the departure,\nThe Pilot is prepared, the signs,\nAre showing themselves forth,\nAnd the door shall soon be shut."
  },
  "134": {
    "title": "I Shall Be Glad If Charity Be in My Soul",
    "lyrics": "I shall be glad if charity be in my soul,\nNow that the Almighty Being hath saved me;\nHe came to die in this world of sin,\nHe shall lead me unto that celestial Abode.\n\nCHORUS: I am nothing, if I have not charity\nWhich is true love;\nWithout love I endure not\nIn Jesus my Savior.\n\nYea, I shall arrive if I endure in His way,\nAnd if also in His Word I delight;\nI follow not men, for from them I expect naught\nI follow the footsteps of Jesus, my faithful Lamb.\n\nHe marked the footsteps with the blood of His veins,\nWhen on the cross He was offered as a whole burnt offering;\nThat the world might be saved from its sorrows,\nFrom chains of oppression in this deceitful world.\n\nI fix my gaze upon that mark which is perfect\nIn Whom there is no change nor variation in His dwellings,\nI will follow Him as long as He giveth me breath\nTill awaiting there in the tomb His appearing."
  },
  "135": {
    "title": "Christ Is Our Captain",
    "lyrics": "Christ is our Captain, He leads us to the fray,\nAnd in His Holy Name, fight ye evermore,\nFor His holy cause, we must surely strive,\nAnd we will serve Him faithfully.\n\nCHORUS: Forward! 'Tis the commandment of the Lord,\nForward! Let us go without fear;\nForward! Now His flock doth sing,\nVictory is certain with the King,\n\nOurs is the victory, Jesus Christ is God,\nAnd in His holy Name we march without fear;\nLet nothing daunt us, let us go with courage,\nWe shall all overcome.\n\nWe are baptized in Christ Jesus,\nHe hath saved us by dying on the cross;\nHe hath sealed us with His Spirit,\nAnd we will follow Him faithfully.\n\nOur banner shineth everywhere,\nWith power and glory it shall ever be seen;\nChrist our Captain overcame the world,\nAnd we will follow Him faithfully.\n\nThe precious struggle shall not be long,\nAnd the overcomers He shall gather together;\nWhere we shall sing a triumphal hymn:\nYea, we will follow Him faithfully."
  },
  "136": {
    "title": "The Angels",
    "lyrics": "The angels of heaven, in heavenly choirs\nPraise the good Savior;\nAnd all mortals joined in one chorus,\nGive honor and glory unto God,\n\nBecause in His divine plan\nHe had prepared salvation for the sinner\nSending His beloved Son who was crucified.\nTo give eternal life and redemption.\n\n                                CHORUS: \nLet us give glory unto God, (worthy is He)\nLet us give all honor, (worthy is God)\n\nAll the redeemed,\nThose who have believed in Christ,\nToday proclaim Him their Lord,\nAnd today all unitedly say\nWith thanksgiving, Blessed be the Savior,\nFor when we were lost from God\nYea, cast off, in His kindness He gathered us,\nDead in sins, He hath raised us up,\nThrough His Son Jesus Christ life He gave unto us.\n\nJoyful and triumphant today we sing victory.\nThrough Jesus Christ the King of Zion\nAnd joyfully we say that we go to His kingdom\nFor there is our dwelling place\nWhich the Lord Jesus Christ, He\nHath prepared for us to dwell in His Mansion.\nAnd at the end of the journey to be crowned,\nAnd in fullness of joy to praise God."
  },
  "137": {
    "title": "O Beloved People",
    "lyrics": "O beloved people of the Lord,\nNow that thou art gathered here together;\nIn this house of prayer,\nWe all must beseech Jesus Christ,\nThat He may bless us with His holy blessing\nWe have come with a willing heart,\nTo feed upon the word of Jehovah,\nHe who for ages of ages is the\nSame, and shall ever be throughout all eternity.\n\nCHORUS: Faint thou not, beloved people\nAnd though in this world thou sufferest a thousand\nReproaches and sorrow\nBehold Christ agonizing\nUpon the tree, because He would not\nLet the sinner be lost. \n\nO beloved people, thou must take heed\nThat the ministry giveth unto us\nNourishment; we shall understand\nThat all its teachings\nWe obtained through fasting and prayer\nBut if any should turn aside from the way\nTo turn again unto wickedness\nDeuteronomy telleth us in chapter twenty-eight\nVerse twenty, what shall befall him\n\nAs the Elder is responsible\nFor the minister, so the Deacon\nFor the minister likewise.\nIt is a duty to watch over one another\nAnd Jesus Christ over the church in general\nThen Saint Paul thus spoke unto Timothy\nSecond epistle, chapter also\nVerse twelve affirms unto us\nThat he who suffereth here for Christ\nShall reign yonder with Him."
  },
  "138": {
    "title": "Be Strong and of Good Courage",
    "lyrics": "Be strong and of good courage\nFrom the days of thy youth;\nFor the evil days shall come,\nAnd the unfaithful shall perish.\n\nCHORUS: Gird thy sword upon thy thigh\nO youth, and declare\nThe teachings of salvation.\n\nBe strong, O holy seed,\nDestroy all wickedness;\nLet all peoples behold,\nHoliness in reality.\n\nBe strong unto the battle,\nO Church of Jesus;\nFor the night is passed away,\nAnd the Light hath shined forth.\n\nBe strong, for Jesus calleth thee\nThou must fight for Him;\nAnd thou shalt have eternal life\nWith the Holy One of Israel."
  },
  "139": {
    "title": "With Christ I Desire to Be",
    "lyrics": "With Christ I desire to be,\nHis wonders to behold;\nAt His feet I will learn,\nThe glories of my God and King.\n\nCHORUS: O keep me, Lord Jesus!\nMore faithful to Thee beside Thy cross;\nTeach me Thy holy will,\nAnd keep me in Holiness.\n\nMake me patient in sorrow,\nImpart unto me Thy protection;\nI never want to faint,\nAnd ever stand firm for my King.\n\nGrant me more faith, my Savior,\nImpart unto me Thy great favor;\nGrant unto me a firmer faith,\nI desire to be faithful to Thee, Lord."
  },
  "140": {
    "title": "Fighting for Jesus",
    "lyrics": "Fighting for Jesus, even unto death\nConstant to His banner I shall live;\nThough death be vile and treacherous\nI will never fear, trusting in God.\n\nCHORUS: Christ is the only inspiration,\nTruth that comforteth the heart;\nLight that dispelleth darkness,\nThe most wondrous reality,\nUnited unto Christ through faith,\nJoyfully ever will I say to Him,\nIf Thou callest me, here am I,\nBlessed Christ, I am Thine.\n\nMay my whole life, consecrated\nFor Jesus, ever be employed;\nAnd following Christ upon the journey,\nI will never fear, for Jesus is God.\n\nCome unto Christ, He is calling thee,\nForsake all thy sins;\nAnd in His Name being baptized\nAnd the Lord shall give His Spirit unto thee."
  },
  "141": {
    "title": "In These Times Wherein We Live",
    "lyrics": "In these times wherein we live,\nStriving ever with earnest care;\nUnto our flesh we daily die,\nThat we eternity may gain.\n\nCHORUS: Fight on we must and never rest,\nThat we eternity may gain;\nIf we at last would enter joy,\nIn holiness we ought to walk.\n\nEvery soldier who faithfully fights,\nMust be provided with charity;\n'Tis the armour that he doth need\nUnto eternity to attain.\n\nIn these perilous times of woe,\nWhen death resoundeth on every side;\nGod promiseth we shall overcome,\nAnd give us eternity to inherit. \n\nIn these times wherein we live,\nA time of wrath and of darkness deep;\nIn these times of peril great,\nFight on we must and never rest.\n\nKnow this, that these are now the days,\nThe latter days of peril great;\nUnto the coming of the King of kings,\nWe must forever watch and pray."
  },
  "142": {
    "title": "A Wretched Soul Would I Be",
    "lyrics": "A wretched soul would I be\nWithout my Lord;\nIn this world without a home\nNone have I here,\nMy Saviour offereth me\nThis day a new home,\nWhere for ever I shall dwell.\n\nCHORUS: //:With Jesus my Saviour I will go,\nWalking onward unto that home: //\n\nA new hope have I now with\nMy Lord\nFor I have found salvation free\nWith my Lord;\nI have no sorrow anymore,\nNow gone is all grief\nBecause my joy in Christ doth rest.\n\nI can do naught but follow on\nThe Saviour dear,\nTo serve Him faithfully in truth\nWith all my heart;\nThat I may come with Him:\nUp there to enter joy,\nIn the mansion where Christ abides.\n\nMy Saviour speaketh unto me:\n\"Go, sin no more,\nBe holy, for that I am holy,\nAnd thou shalt see Me;\nFor otherwise thou shalt not come\nInto the mansion\nOf the New Jerusalem.\""
  },
  "143": {
    "title": "He That Overcometh Shall Be Clothed",
    "lyrics": "He that overcometh shall be clothed\nIn raiment of pure white;\nAnd I will not blot out his name\nFrom the Book of Life.\n\nCHORUS: Yea, with courage and with love\nYea, we will march till we arrive;\nYea, with courage and with love,\nWe are marching on behind\nThe King of Zion.\n\nThrough the desert we are marching,\nLet us follow Jesus;\nHe shall be our refuge\nIn tribulation.\n\nAfter the triumph\nHere upon earth,\nA crown awaiteth us,\nAnd with laurel and with palm\nWe shall enter triumphant."
  },
  "144": {
    "title": "Forward, Ye Squadrons of Israel",
    "lyrics": "Forward, ye squadrons of Israel,\nVictory Jesus unto us will give;\nWith the sword of the LORD and of Gideon,\nWe shall conquer evil and the dragon;\n\nCHORUS:\n Gladly the people of the LORD,\nRendereth and singeth praises;\nLifting in peoples, lands,\nAnd nations, the banner of holiness.\n\nForward, ye chosen of the Lord,\nJesus the Captain goeth before;\nHe guideth our life in holiness,\nAnd through Him we shall conquer Satan.\n\nForward, let us go forth to fight,\nFaint we not, let us strive with constancy;\nThe Great Day is already dawning,\nHow joyful we shall go to enter bliss!\n\nForward, be of good courage, like Him,\nDefying both sin and temptation;\nThe valiant take the kingdom by force today;\nI stay not behind, I will fight even as they."
  },
  "145": {
    "title": "Through Christ Is Joy Bestowed",
    "lyrics": "Through Christ is joy bestowed,\nUnto him who hath left his rebellion;\nHis portion is Eternal Life\nIn the resurrection.\n\nCHORUS: 'Tis Christ who helpeth man\nTo overcome;\nThrough His promise is power given him,\nHe filleth the soul with grace and courage;\nOur confidence resteth in the Lord.\n\nLet us follow step by step\nThe footsteps of Jesus the Saviour;\n'Tis He who breaketh the snare\nWhich the tempter hath laid.\n\nLet us ever honour Christ,\nThe divine God of love;\nHe is the Light that shineth,\nHe is the Good Shepherd."
  },
  "146": {
    "title": "All Who Belong to God Our King",
    "lyrics": "All who belong to God our King,\nAre gathered in His flock;\nFor here is God with power,\nHis name is Emmanuel,\nWho delivered Israel;\nHe delivered us also\nWith His arm of power.\n\nCHORUS: A mighty God is the LORD,\nHe vanquished the enemy;\nWith a mighty arm He brought out\nHis people from wickedness;\nO what great mercy,\nThat for me He came to fight!\n\nAll with the courage of the Lord,\nFollowing the Saviour;\nWe go with Jesus the Shepherd,\nHe leadeth us to know\nThat City of Zion\nWhich we desire to see,\nAnd dwell there with Him.\n\nLet no one look back, saith God,\nNow all hath perished;\nLet us look unto Him who died,\nWho hath set us free;\nOur heritage is not here,\nIt is with our King,\nThrough the grace of the Lord.\n\nAll ye of God our King,\nDo His holy will;\nUntil ye reach the place where He is,\nHe who shall give unto us\nGlory for an inheritance,\nAnd all thy sorrow\nShall be turned into joy."
  },
  "147": {
    "title": "The Heavens Declare the Glory of God",
    "lyrics": "The heavens declare the glory of God,\nThe mountains clap their hands in love;\nThe chosen ones whom Christ hath bought\nDay and night give glory to the Creator.\n\nCHORUS: O LORD of hosts,\nWorthy Heavenly Father;\nAlpha and Omega, the Eternal One,\nBlessed be Thy lovingkindness.\n\nTrusting ever in God,\nTogether we shall see the final prize;\nWhen the Lamb who cleansed us\nShall say unto us, \"Come, enter into joy.\"\n\nFor the saints who worship God,\nThe cross of Christ shall be light;\nBearing on high the pardon of love,\nThey shall behold the Homeland of liberty."
  },
  "148": {
    "title": "I Love Christ",
    "lyrics": "I love Christ, He is my friend,\nHe hath healed me, He hath saved me;\nPower He hath given me,\nFor He hath filled me,\nWith the Holy Spirit of\nGod the Comforter.\n\nO hallelujah!\nJesus, I adore Thee, my God, my all;\nMighty King, I wait for Thee,\nComing King, Thou shalt take me,\nAnd with Thee I shall dwell.\n\nNow I feel the fire\nOf the Spirit of God within my soul,\nOf God within my soul;\nNow I feel the fire\nOf the Spirit of God within my soul,\nGlory be unto Him!"
  },
  "149": {
    "title": "Not Unto Us, O LORD!",
    "lyrics": "Not unto us, O LORD, not unto us,\nBut unto Thy name give we glory;\nFor the love which Thou hast shown to us,\nAnd for Thy great mercy.\nNot unto us, O LORD, not unto us,\nBut by Thy mighty power;\nFor Thou art, O LORD,\nA mighty God; through Thee we shall overcome.\n\nCHORUS: Without Thee, we can do nothing,\nThrough Thee, we shall overcome,\nAnd through Thee, we shall sing of victory;\nNot unto us, O LORD! Not unto us,\nBut unto Thy name we give glory.\n\nWe conquer today temptation and the enemy,\nAnd endure it by His grace;\nFor the Lord, who is Christ Jesus,\nIs our refuge and strength.\nOur Refuge and hiding place is the LORD,\nHe is our defender;\nHe with His rod and His staff giveth comfort,\nHe is our Good Shepherd.\n\nThe redeemed shall have victory through Jesus,\nOver this deceitful world;\nChrist Jesus conquered the enemy,\nAnd today He reigneth victorious.\nHe liveth on the Heavenly Throne full of glory,\nAnd His Church here below shall say:\nNot unto us, O LORD!\nNot unto us, but unto Thee for Thy goodness."
  },
  "150": {
    "title": "When the Lord Brought Out the People of Israel",
    "lyrics": "When the Lord brought out\nThe people of Israel;\nThe Passover He ordained,\nIn memory of Him.\n\nCHORUS: In token of His body,\nThe bread we break today;\nThe cup whereof we partake\nIs the blood of the Lord.\n\nAll the people united,\nWith one heart and one soul;\nNow prepare the Passover,\nIn holy communion.\n\nThe Lamb that was slain,\nDoth symbolize the Lord,\nWho was crucified\nFor the vilest sinner.\n\nThe blood of the Lamb\nFrom death hath saved us;\nThe blood of Calvary\nHath redeemed even me.\n\nLet us eat all together,\nThe bread with devotion;\nLet us drink of the cup,\nUnto our salvation."
  },
  "151": {
    "title": "Christian Explorers",
    "lyrics": "Christian explorers,\nIn the forests of pain;\nValiant explorers\nWho obey the Lord.\nGo forth determined, ever battle-ready,\nUnto the caverns of evil;\nWithout any sloth, with skillful hand,\nFight on and faint not.\n\nCHORUS:\n Put thy faith in the Lord, \nThy loving Guide,\nThine only Friend upon the earth,\nThy glorious Saviour;\nWalking ever with Him,\nEven in the cruelest fight;\nHe shall impart strength unto thee,\nThe glorious Emmanuel,\n\nThere are many lost souls,\nWhom we urgently must rescue;\nThere are cast down ones everywhere\nWhom we surely must comfort.\nThe holy Gospel of Christ,\nThe only emblem of peace,\nIs medicine for the souls,\nIs an eternal solace.\n\nFiery darts are hurled against us\nBy the wicked one in fury:\nHe would slay the souls\nWho have believed in the Lord.\nWith the shield of our faith,\nWe must withstand;\nWith our sword ever in hand,\nThus we will go forth to fight."
  },
  "152": {
    "title": "Jesus, My Strong and Mighty One",
    "lyrics": "Jesus, my strong and mighty One, \nIn Thee I find my rest,\nI was saved by Thy love; \nUnto my soul Thou gavest life\nWhen it was lost \nIn the path of error.\n\nCHORUS: Thou camest down from Heaven, \nTo seek and to save,\nAll created beings \nWho walked in evil.\nThou didst climb to Calvary, \nThy blood to shed; \nFor being God Himself, \nThou didst humble Thyself.\n\nThou art my refuge and my strength, \nAlso my present help,\nIn tribulation;\nWherefore I have promised \nTo serve Thee for ever,\nWith all my heart.\n\nThou art resurrection and life,\nUnto those who are dead \nThrough their great wickedness; \nBelieving on Thy holy name, \nAnd being baptized,\nWith Thee they shall live.\n\nThou shalt welcome \nThe obedient servant,\nIn the Jerusalem;\nThou shalt give him eternal life\nIf faithfully he endure,\nIn Thee, of Israel"
  },
  "153": {
    "title": "The Azure Sphere",
    "lyrics": "The azure sphere is all arrayed\nTo wait for the King of Zion,\nWith a thousand stars adorned\nBecause the Saviour cometh now. \n\nCHORUS: In the clouds of heaven He shall be seen, \nWith all His armies He shall come; \nThe Church of the Lamb is ready now \nTo go and rejoice with Jesus Christ.\n\nThe Church is now prepared\nAnd waiteth today for the Saviour,\nArrayed in holy vestments\nOf charity, peace, faith, and love.\n\nThe Church waiteth with faith and calm\nFor Him who on the cross redeemed her; \nWherefore she singeth with all her soul: \n\"With Jesus Christ to heaven I go.\""
  },
  "154": {
    "title": "The LORD, Deliverer",
    "lyrics": "O LORD, Deliverer,\nToday we give Thee glory, Lord;\nFor Thou hast delivered us\nFrom dark bondage, O Lord JEHOVAH,\nThrough Thee we have salvation.\n\nCHORUS: The LORD keepeth truth for ever, \nThe LORD executeth judgment for the oppressed, \nThe LORD giveth bread to the hungry,\nThe LORD looseth the prisoners; \nThe LORD openeth the eyes of the blind, \nThe LORD raiseth up them that are bowed down; \nThe LORD loveth the righteous,\nThe LORD preserveth the strangers.\n\nO LORD God of Israel,\nBehold here all Thy flock;\nWhom Thou didst deliver in love,\nWith an arm of power; Thy faithful people\nWith joy desireth to see Thee.\n\nThe LORD our Guide,\nUnto glory He shall lead us;\nTo rejoice there with Him\nIn what He prepared for us; a faithful promise, \nRight soon shall He fulfill it."
  },
  "155": {
    "title": "When Christ Found Me",
    "lyrics": "When Christ found me \nLost in iniquity;\nHe stretched forth His hand to me,\nAnd gave me His liberty;\nWhat gratitude do I feel today\nUnto my Christ Jesus!,\nHis life He surrendered for me\nThere nailed upon the cross.\n\nCHORUS:\n Liberty the Lord doth give, \nUnto every sinful man; \nLiberty, salvation,\nIs the free gift of God:\nGlory to Christ the Saviour!\n\nWhen in the world I wandered\nWithout hope and without God,\nEnslaved unto sin\nAnd in paths of error;\nThe grace of Jesus Christ\nWas abundant in my affliction,\nAnd I have promised to serve Him\nIn holiness of heart.\n\nNow prostrate at Thy feet \nI come to implore Thy favour,\nMay Thy grace strengthen me\nAnd Thy love shield me. \nI desire to bear Thy Word\nUnto every sinful man;\nThat souls may believe\nThat Thou art a God of love.\n\nO divine Redeemer!\nThou who art great in power;\nKeep me ever in Thy love, \nFor I would serve Thee faithfully.\nThou hast promised to help \nEvery sinful man; \nThat he may attain \nSalvation for his soul."
  },
  "156": {
    "title": "Thou Wast Nailed to the Cross",
    "lyrics": "Thou wast nailed to the cross,\nBecause of my sin;\nAnd therefore, O my Jesus,\nHumbly I come to Thy feet.\n\nCHORUS: Lord, I am waiting for Thee \nTo come hither once again, \nAnd therefore am I praying, \nOn my knees at Thy feet.\nI have naught else to offer Thee, \nFor so great salvation,\nAnd humbly I come to give Thee\n/:/My contrite heart/:/\n\nThou didst suffer grief so great,\nFor the vilest sinner;\nAnd to come to rescue me,\nThou didst heed not Thy pain.\n\nWhen Thou comest once again,\nWith Thine angels of light;\nThou shalt see me at Thy feet,\nBy the glory of Thy light.\n\nWith the brightness of Thy light,\nGlorious in rising again;\nThou didst bring us, O Jesus,\nRest and life everlasting!"
  },
  "157": {
    "title": "When Moses Brought Israel Out",
    "lyrics": "When Moses brought Israel out of that Egypt,\nHe kept the Passover with great love and rejoicing; \nFrom that bondage God delivered His people,\nWith great glory the LORD redeemed them.\n\nCHORUS: I too was a servant of sin,\n A bondslave in spiritual Egypt;\nMy good Jesus hath set me free; \nBy grace am I free from all evil.\n\nPharaoh, greatly displeased, then pursued Israel,\nHe went forth in great fury and his army with him;\nThere they overtook them encamped by the sea,\nAnd Moses said: \"The LORD will help us.\"\n\nMoses lifted up his hand and stretched it over the sea,\nHe divided the waters that they might pass through; \nPharaoh of Egypt was buried in the sea;\nEven so the LORD willed to be glorified. \n\nThus the LORD saved Israel with great love,\nThe people there feared and put their faith in Him; \nThey believed in His servant, who spoke truth to them,\nAnd Moses said: “Who is like unto Thee, O LORD!”"
  },
  "158": {
    "title": "When Christ",
    "lyrics": "When Christ found me in evil\nHe offered me His holy love and peace,\nAnd said unto me tenderly, \"Follow Me,\nHarden not thy heart this day.\"\n\nCHORUS: \nI felt the calling\nWhen I knew that He died on the cross,\nAnd that being innocent,\nFor love He paid it all for me.\n\nI was that one lost in wickedness,\nWithout refuge in iniquity,\nIn rags and wasted away was I,\nBut Jesus rescued me from thence.\n\nJesus Christ is indeed a faithful friend,\nHe is my neighbour, for He helped me;\nSore wounded was I, and He bound me up,\nAnd took me to a place of protection.\n\nOn the morrow He commended me,\nTwo pence He left behind there,\n\"If aught more is needed, on my return I will repay;\"\nChrist is indeed my neighbour in truth."
  },
  "159": {
    "title": "On Earth I Will Sing, 'I Am Saved!'",
    "lyrics": "Upon the earth I will sing:\n/:/I am saved/:/\nFor Christ forgave mine iniquity,\nI am saved.\nBy His blood which He shed on the cross,\nI am saved.\nAnd therefore I will sing: ... I am saved.\n\nCHORUS: I am saved... I am saved... I am saved. \nUpon the earth I will sing: . . . I am saved.\nAnd in Heaven I will say: ... I am saved.\nThrough the Name of Jesus …I am saved!\n\nSince I came to the feet of Jesus,\nI am saved:\nHe was pleased to forgive me. /:/I am saved/:/\nWith love He spoke to me thus: \"Go, and sin no more\"; \nAnd therefore I will sing: I am saved!\n\nIn my life I will sing: /:/I am saved/:/\nThrough the Lamb of God, /:/I am saved/:/\nMy sins He hath blotted out:  /:/I am saved/:/\nAnd therefore I will sing: I am saved!\n\nI feel joy as I sing, /:/I am saved/:/\nFor I live unto God, /:/I am saved/:/\nUnto my God I will sing, /:/I am saved/:/\nNow and ever I will sing: I am saved!"
  },
  "160": {
    "title": "The People of the LORD",
    "lyrics": "The people of the LORD \nDoth arm them for the fight;\nAnd through holiness,\nTriumphant shall come forth.\nThey have a Helper near,\nEven Christ the Saviour,\nThrough Him, who ever vanquisheth\nThe fierce tempter.\n\nCHORUS:\n Already there appeareth in sight,\n The land of promise;\nWhereunto they shall go to rest, \nEven the pure in heart.\nToday I invite thee, brother, come, \nUnto the Church of the Lord;\nPartake thou also\nOf this great blessing.\n\nThe mountains and the sea,\nThe rain and the whirlwind;\nThe thunder and the storm,\nPraise the Lord.\nLikewise my heart,\nPraiseth Thee, O my God,\nIn this day of rejoicing,\nIn Thy Congregation.\n\nThings which eye hath not seen, \nNor ear hath perceived,\nDoth now reveal to us\nThe divine Shepherd.\nHis death upon the cross,\nWherein He suffered pain,\nDoth show us now the light,\nThrough His infinite love."
  },
  "161": {
    "title": "The Morning Hath Come",
    "lyrics": "Now the night with all its shadows fled away, \nThe morning hath come;\nAnd dwelling in the fullest light am I,\nThe morning hath come.\n\nCHORUS: Great joy now reigneth\nIn my heart . . . ; through Jesus\nEvery shadow hath dispelled\nMy Lord... in love,\nAnd singing joyfully I go\nFor with Jesus I abide,\nGreat joy now reigneth.\nIn my heart.\n\nChrist maketh a new world for me, \nThe morning hath come;\nAnd through Him and in Him life is wondrous here, \nThe morning hath come.\"\n\nA life of radiant splendor I shall live,\nThe morning hath come. \nFor upon Christ my Lord shall I rely,\n The morning hath come."
  },
  "162": {
    "title": "Unto the Virgin It Was Announced",
    "lyrics": "Unto the virgin it was announced\nBy the angel of the Lord;\nThat she must needs conceive,\nFor the world a Savior.\n\nCHORUS: \nHe was borne unto the cross for thee and me; \nHe was borne unto the cross for thee and me; \nUpon the cross He died for me;\nUpon the cross expired for thee.\n\nHe was judged and scourged\nAnd led even unto the cross;\n\nWith three nails was He transfixed,\nThe Lord of glory and of light.\nYet was He raised to life again,\nAnd to the heavens He ascended;\nAnd at the right hand is seated, \nOf the majesty of God.\n\nFrom on high He now doth call thee. \nHearken, thou poor sinner;\nHe giveth thee eternal life,\nAnd delivereth thee from error."
  },
  "163": {
    "title": "What Great Joy This People Feeleth Now",
    "lyrics": "What great joy now feeleth \nAll this people;\nWhich hath been washed\nIn the blood of the Lord. \nMany blessings\nDoth it receive each day,\nThrough the Spirit of grace \nWhich Christ hath poured forth.\n\nCHORUS:\n Already hath been fulfilled, \nThe promise of the Lord,\nNow hath been poured forth, \nThe Spirit of God;\nAlready have been fulfilled \nThe words which He spake, \nI will send unto you,\nThe Comforter.\n\nThe Holy Spirit,\nWhom the world\nKnoweth not, \nNeither indeed\nCan receive Him;\nChrist said: \"He dwelleth with you\" \nAnd shall be in you,\nFor ages without end.\n\nHis promises,\n Have now been fulfilled;\nNow only \nMust we await\nWith patience; \nThe day of His coming,\nThat He may bear us to glory,\nWith Him, to rest."
  },
  "164": {
    "title": "The Samaritan Woman",
    "lyrics": "Unto Jacob's well there came,\nChrist the Savior, and water asked He,\nOf a woman who drew thither\nAnd said unto her: \"Give Me to drink, woman\".\n\nCHORUS:\n Samaria received from Jesus\nHis salvation\nThrough a woman who concerning\nHis Word did speak;\nTelling the glad tidings which \nChrist to her made known,\nAnd she said to the people: Come, come and see\nHim who spake unto me, yea perchance He be\nChrist the Lord.\n\nThe woman then was sore amazed\nThat this man all things revealed to her,\nAnd with joy unto the city she came \nProclaiming the wonder of her heart.\n\nThe Samaritan woman understood\nThe gift of Jesus and perceived;\nWherefore also Jesus gave unto her, \nLiving water which shall spring up\nUnto life eternal.\n\nWhosoever will, let him come and take here\nOf the water of life which Jesus giveth;\n'Tis freely given, and to whomsoever will He giveth,\nDespise not Him who speaketh to thee\nIn sincere love."
  },
  "165": {
    "title": "What Wilt Thou Say to Know?",
    "lyrics": "What wilt thou say to know,\nThat thy friend most true,\nKnew not the story blessed,\nOf the love of Jesus,\nOf His death upon the cross,\nWhat wilt thou say when he thus doth speak?\n\nCHORUS: They never told me of Christ, \nThey never told me of Christ; \nMany I knew, yet from none did I hear \nTell me the story of Christ.\n\nOh, how mournful 'twill be!\nThat an immortal soul,\nKnew not that He came to save it,\nThe loving Lord,\nWho for it died,\nWhat wilt thou say on hearing his words?\n\nOh, wait thou no longer;\nThou must not keep silence;\nThe blessed story of Christ, \nLest thou shouldest hear,\nAny one say: \"There was none \nTo tell me of Christ\"."
  },
  "166": {
    "title": "Seed That We Have Sown",
    "lyrics": "Seed that we sowed at the dawning of day,\nSeed that we sowed when the sun was high; \nSeed that the evening beheld decline, \nSeed that night's curtain doth veil.\n\nCHORUS: Ah! What shall the harvest be? What shall the harvest be?\nThat which in light or in darkness I sowed; \nThat which we sow shall a harvest yield,\nWhether in time its fruit shall appear\nOr whether it yield, in eternity.\n\nSeed that we sowed in 'mire and clay, \nSeed that in midst of the thorns perished; \nSeed that the wind on the stony ground cast, \nSeed that a fertile soil did find.\n\nSeed that we sowed with unceasing tears, \nSeed pressing bitterest gall in the soul;\nSeed of pure faith that discerneth the rest,\nSeed of rejoicing and crown of the faithful."
  },
  "167": {
    "title": "In Season Have I Besought Thee",
    "lyrics": "In season have I besought Thee \nTo bring unto the fold,\nAll of the creatures\nWhom Thou wouldst redeem;\nGrant unto them understanding\nThat they may never suffer\nThe grievous and heavy sorrow\nWhich surely is to come.\n\nCHORUS: O Lord! O Lord!\nLet not even one be lost,\nMay they have salvation:/\n\nTrusting in Thy holy Word,\nI will go pressing on\nCarrying forth Thy Gospel,\nAnd Thou wilt make it heard. \nNow is the time that they seek Thee,\nForsaking every error, \nThat they may obtain life;\nAnd enter the heavenly mansion.\n\nStretch forth Thy mighty power\nThat they may feel Thy presence;\nAnd by the strength of Thine arm,\nThou mayest them redeem;\nWithout Thee no man is able,\nO Lord, to see or hear;\nIn slumber is each one sunken,\nBefore unto Thee he cometh.\n\nFor mine own self I pray Thee, \nThat I may truly serve,\nThee, God our gracious Father,\nProlong my days on earth.\nI trust that Thou wilt hear\nMy humble supplication,\nThat I may ever serve Thee\nWith all my heart,"
  },
  "168": {
    "title": "'Tis the Time of the Harvest",
    "lyrics": "It is the time of the harvest\nAnd thou art not awake,\nDeclaring at thine ease\nThere is no work to do;\nWhile all the while the Master\nDoth call to thee again:\nYouth, O youth, come labor now.\n\nCHORUS: Come and see the fields all white\nHow they stand,\nWaiting for hands to reap the grain; \nYouth, awake, do so quickly\nAnd be alert,\nBe the first to say to Him:\n\"Here am I, Lord\"\nEverywhere doth bow\nThe ripened harvest field,\nWhich the breezes stir\nAnd how fair it is,\nYouth, awake, do so quickly\nAnd be alert. Few days there are\nRemaining for the reaper.\n\nThe sheaves that thou shalt gather,\nJewels of splendor bright,\nShall shine within the crown,\nWhich the Lord shall bestow;\nSeek quickly jewels eternal,\nGod is the rewarder:\nYouth, O youth, come labor now.\n\nThe morning passeth by\nAnd never shall return,\nSoon the time of the harvest\nHere on earth shall end;\nThou wilt find thyself at last empty \nBefore thy Creator,\nYouth, O youth, come labor now."
  },
  "169": {
    "title": "O Messenger of the Master",
    "lyrics": "O messenger of the Master, come,\nHe sendeth you, unto His work make haste;\nVast regions, peoples, and nations,\nOf God's holy love desire to hear.\n\nCHORUS: Haste thither, youthful ambassador,\nProclaim that Christ came down to die, \nTo save the wretched sinner,\nFrom iniquity his soul to redeem.\n\nGo to thine own with courage bold, \nTell what the Lord hath done for thee, \nThat thy sins are blotted out forever,\nAnd with peace He hath filled thy heart.\n\nGo through the streets of thy native town,\nTo all the souls that groan in bondage to sin; \nFear not before the face of man,\nSpeak of the Savior, eternal King.\n\nLift up thine eyes to the fields and behold, \nGolden grain already ripe is seen;\nGo, faint not, through mountains and vales, \nTraverse them for Jesus, He saith: Go!\n\nSoon shall come the good Lord of the harvest, \nWe shall find our joy at His blessed feet; \nGladness shall be ours, today let us praise\nHis sweet Name here with song and extolling."
  },
  "170": {
    "title": "A Sunbeam for Christ",
    "lyrics": "A beaming sunbeam for Christ\nI would forever be;\nIn all things I would please Him, \nAnd do so with delight.\n\nA beaming sunbeam,\nA beaming sunbeam for Christ;\nA beaming sunbeam,\nA beaming sunbeam I'll be.\n\nUnto Christ I would draw near, \nIn the days of my youth;\nForever I would love Him \nAnd do His holy will.\n\nA beaming sunbeam in darkness, \nI desire to brightly shine;\nLost souls unto Christ, \nI yearn to lead along.\n\nA mansion in highest heaven, \nDid Christ go to prepare;\nThat the child so tender and loving, \nMay enter therein to dwell."
  },
  "171": {
    "title": "Speak to Me More of Christ",
    "lyrics": "I would that ye speak of that wondrous love \nWhich on Calvary… God showed to us; \nI would that ye speak of the Savior good,\nSpeak to me more of Christ!\n\nCHORUS: I would hear the faithful story\nOf my Jesus, my Savior;\nI would live for Him alone,\nSpeak to me more of Christ!\n\nWhen temptation assaileth me\nAnd spreadeth its snares about my feet; \nI would find in Him protection, \nSpeak to me more of Christ!\n\nWhen in the conflict faith doth fail\nAnd the soul feeleth faint within; \nI would know that help I shall have, \nSpeak to me more of Christ!"
  },
  "172": {
    "title": "I Will Sow the Precious Seed",
    "lyrics": "I will sow the seed so precious, \nOf the glorious Gospel of love; \nI will sow with a joyful spirit, \nFor God ever loveth the giver.\n\nCHORUS: I will give unto the Lord,\nA blessed offering of love;\nI will give by faith,\nFor God ever loveth the giver.\n\nI will sow generous and loving \nThat the harvest of the Lord may grow; \nI will sow being ever steadfast \nWith the offering I give in love,\n\nI will sow over rugged mountains, \nThis grain of sand that I bestow; \nAnd in palaces and humble cots \nTo my God I will give all I am."
  },
  "173": {
    "title": "Youth, Let Us Go Forth to Battle",
    "lyrics": "Youth, let us all go forth to battle,\nThe Gospel ever to defend;\nThe lost must surely now be won\nWielding the weapon of His might.\n\nCHORUS: Jesus doth guide us, yea, He is the stay\nOf every youth that trusteth Him.\nIn every conflict with the foe; \nSecure we go, we need not fear, \nThe cause is not our own, the cause is His, \nAnd we shall conquer every foe.\n\nIn all the battles that shall be fought, \nAgainst the hosts of Satan's realm;\nWe must not lose sight of our Captain, \nAnd thus display the victor's palm.\n\nAll of the youth shall gather near,\nUnto the banner of the cross;\nAnd so from triumph to triumph gain \nGlorious honors in the Lord.\n\nMen groan in heavy, sore distress. \nLet us fulfill our sacred trust; \nGo unto them for their defense,\nIn Christ we surely shall prevail."
  },
  "174": {
    "title": "Go Forth to Sow, O Sower",
    "lyrics": "Go forth to sow, O sower of peace, \nFollow the footsteps of Jesus good; \nRich harvest shalt thou have, be true, \nFollow the path of peace and light.\n\nCHORUS: Go, go, O sower,\n Go, go, and sow the peace;\nTell everywhere of Christ the Lord, \nAnd of His holy peace.\n\nVast is the field, go forth to sow,\nSow thou the ground that God doth give”\nIf thou sowest ever trusting in God,\nHe shall thy labors crown.\n\nWaste not the fleeting time, go forth,\nSow words of everlasting peace; \nEternal seed that yields its yield,\nA precious seed that will not fade.\n\nGod hath commanded, go and sow,\nTidings of life, of love, and peace;\nThough it should cost a thousand tears,\nYet shalt thou have solace in heaven.\n\n2nd Chorus: \nI go, I go, I go, O Lord, \nI go, I go, sowing Thy peace; \nSpeaking forever of the Lord\nAnd of His holy peace."
  },
  "175": {
    "title": "Messengers of the Sovereign King",
    "lyrics": "Messengers of the Sovereign King,\nProclaim the message all divine; \nTeach ye the truth and show the way,\nOf Jesus, holy, blest, sublime.\nIn tender love lead fallen men \nUnto the heavenly courts above:\nComfort impart to sorrowing hearts;\nAnd to the wanderer give light.\n\nCHORUS: Champions of faith, the Church awaits,\nYield up your lives with joyful heart;\nAnd sow the precious seed of Christ,\nDeep in the soul of all mankind.\n\nRedeem poor souls from paths of vice,\nRelieve their burdens and their grief; \nSever the heavy bonds and chains,\nWhich sin hath bound upon their hands. \nO holy land of blessed joy,\nFair gift of God from heav'n above. \nTo ransom thee from pain and woe\nThe Master shed His precious blood.\n\nSowers, go forth and sow the seed, \nIn winter, autumn, or summer heat, \nOn mountain height, in vale or field, \nFollowing Christ, our Master blest.\nHe that goes weeping through the earth\nTo sow with weariness and tears;\nShall yet return with golden sheaves,\nTo lay them at the altar's foot.\n\nFear not, O little, chosen flock!\nYe shall have trouble in the world;\nYet ye shall be the ministers\nWho shall destroy the reign of sin.\nAnd when the race is fully run, \nThe strife shall turn to victory;\nAnd an immortal crown of praise\nShall bind your brows forevermore."
  },
  "176": {
    "title": "The Messengers Walk Through the World",
    "lyrics": "The messengers who walk through all the world,\nProclaiming the glad tidings of the Lord;\nCast out the spirits unclean and depraved,\nBy nothing save the Word of God the Lord.\n\nCHORUS: Obedience to God is clearly known\nUnto the King and Sovereign Ruler high;\nGod giveth witness to their faithful walk\nUnto the glory of our Christ the Lord.\n\nThough conflicts come and raging tempests blow,\nAnd Satan seek to swallow and devour;\nThe Lord who is our Savior, Christ the King,\nShall come with haste to succor all His own.\n\nThe word proceeding from His holy mouth\nIs like a sword of deep-piercing power;\nTo overthrow the adversary's power,\nAnd grant the sinner full and free release."
  },
  "177": {
    "title": "Lord, I Bear Thee in My Heart",
    "lyrics": "Lord, in my heart I ever carry Thee,\nFor all the love Thou hast bestowed on me; \nAnd in the gladness of my turned soul,\nFaithfully will I ever serve my God.\n\nCHORUS: //: O Lord Jehovah, blest Redeemer mine! \nThine own am I, and all my love is Thine ://\n\nThe plagues which Satan sends across the land\nCannot cause my redeemed soul to fall;\nBecause the holy Word of God my Lord\nShall furnish me with power and with strength.\n\nGive praise unto the Holy One of old,\nWe worship Him with all our heart and soul;\nBecause He hath prepared an heritage\nYonder within His heavenly abode."
  },
  "178": {
    "title": "Keep Me Shining, Lord",
    "lyrics": "Keep me shining, Lord, for Thee,\nIn Thy way of holiness;\nI would be a light below,\nAnd Thy holy truth proclaim.\n\nCHORUS: //: Keep me shining, Lord,\nKeep me shining for Thee ://\n\nI would shine along my path,\nClothed in robes of charity;\nThat the watching world may see\nAll Thy righteousness and truth.\n\nAt the end I shall rejoice,\nIn Thy presence, Savior mine;\nAnd a crown of life receive,\nThrough Thy boundless grace and love."
  },
  "179": {
    "title": "Go Forth Valiant, O Host of Israel",
    "lyrics": "Go forth valiantly, O host of Israel!\nBeneath the banner of pure holiness;\nHaste ye to combat against every ill,\nArmed with the word of holy truth.\n\nCHORUS: Forward, O soldier of the mighty King!\nContending in faith and in courage high;\nFor victory already is made sure,\nIn the Name of Jesus Christ the Lord.\n\nBe not dismayed, thou army of our God,\nThough legions should arise against thy camp;\nBehind the buckler of a holy faith,\nThou shalt prevail unto the very end.\n\nThe recompense shall be exceeding great\nTo him that overcomes in grief and pain;\nWith Jesus Christ at last he shall bear rule,\nUnto eternity."
  },
  "180": {
    "title": "The Valiant Soldiers of Christ",
    "lyrics": "The valiant soldiers of the Lord our Christ,\nGo marching with joy to the holy war;\nClad in the armor of light and of right,\nForever the enemy to subdue.\n\nCHORUS: March on, march on, O valiant flock!\nProclaiming free grace and unchanging faith;\nFor the crown Jesus shall give unto thee,\nIn the celestial city above.\n\nThe royal standard of true holiness,\nBear ye with gladness and fidelity;\nThat all the world may clearly behold,\nThe shining light of truth.\n\nThe recompense shall be exceeding great\nTo him that overcomes in grief and pain;\nWith Jesus Christ he shall forever reign,\nUnto eternity."
  },
  "181": {
    "title": "In the King's Business",
    "lyrics": "In the business of the heavenly King,\nI would ever active be;\nTo serve Him constant in holy fear,\nAnd in His truth persevere.\n\nCHORUS: Oh, what joy it is to serve Jesus!\nTo walk in His path of light;\nFor by His grace He giveth me power,\nUnto the glory of Him.\n\nIn trials and in affliction,\nJesus my rock of refuge shall be;\nHe defendeth me with His great power,\nAnd the victory He will give me.\n\nAt the end of all I shall go to rejoice,\nIn the Mansion of eternity;\nAnd with the saints I shall sing to Jehovah,\nWorld without end, amen."
  },
  "182": {
    "title": "I Am a Pilgrim",
    "lyrics": "A pilgrim in the world am I,\nWalking onward toward my home;\nBy Jesus Christ guided I go,\nAnd into His glory I shall enter.\n\nCHORUS: My sweet home is in heaven above!\nWhere there is neither weeping nor pain;\nThere forevermore I shall sing,\nUnto the Divine Redeemer.\n\nThe cares and trials here below,\nShall never make me faint;\nBecause my Christ giveth me the power,\nAnd filleth me with His peace.\n\nThe mansions that Christ prepared,\nExceeding fair they must be;\nThere joyful I shall dwell,\nWith my Saviour and King."
  },
  "183": {
    "title": "Come, Heavenly Fire",
    "lyrics": "Let fire come from heaven, O Lord,\nOf Thy Holy and Divine power;\nThat I may live in holy love,\nAll the days of my being.\n\nCHORUS: Send the rain, O Lord!\nOf Thy Holy and Divine power;\nThat I may live in holy love,\nAll the days of my being.\n\nThe promise of the Father now is,\nPoured forth into the heart;\nOf those who ask in faith and love,\nUnto the God of salvation.\n\nComforted and filled with love,\nWe march with joy unto Zion;\nPraising God the Creator,\nWith the soul and heart."
  },
  "184": {
    "title": "Jesus Gave Unto My Life",
    "lyrics": "Jesus gave unto my life peace,\nWhen repentant I came to His feet;\nHe transformed all of my heart,\nAnd gave me His sweet pardon.\n\nCHORUS: Oh, what a wonderful change!\nI feel in my soul precious joy;\nSince I am saved by Christ,\nUnto eternal glory I go.\n\nThe world and its pleasures I left,\nAnd upon the rock of faith was I stayed;\nI walk joyful in His path of light,\nBearing my sweet cross.\n\nTo serve Christ is my portion,\nWith all the soul and heart;\nAnd to praise Him with holy fervor,\nFor His boundless love."
  },
  "185": {
    "title": "O Christian Youth! Go Forward!",
    "lyrics": "O Christian youth! Go forward,\nStriving to save sinners;\nFor an eternal reward thou shalt win,\nAnd dwell with the Lord of lords.\n\nCHORUS: Let no other take thy crown,\nWhich Christ hath prepared for thee;\nWhich shall be for all a crown of light,\nWhen the trumpet shall sound for thee.\n\nIf tribulation is wont to weary thee,\nIf the cruel enemy watcheth thy steps;\nCast a glance toward heaven, and instantly\nThe Lord of lords comforteth thee.\n\n United let us advance to the battle,\nTrusting in the blood of Jesus;\nFor He went from the garden unto Calvary\nTo bear our sins upon the cross.\n\nChorus: A crown of diadems awaiteth\nEvery one that cometh forth victorious;\nHis crown shall shine as a glowing light\nBefore the Heavenly throne of Jesus Christ."
  },
  "186": {
    "title": "The Sign That Was from the Beginning",
    "lyrics": "The sign that was from the beginning,\nGiven unto mankind;\nPrince of Peace shall be His Name,\nThroughout all eternity.\n\nCHORUS: It is the Name that was hidden,\nWhich was not revealed;\nJesus Christ, this is His Name,\nIn which I am baptized.\n\nHe was the great and true Messiah\nWho down to earth descended;\nHe brought to the nations light and life,\nYet the world believed not.\n\nThere is only one Name given to the world,\nWhereby one shall be saved;\nThat Name giveth virtue and grace,\nAnd he that believeth shall be saved.\n\nO brother! Knowest thou that Christ\nIs able to save thee?\nCome unto Him, and being born anew,\nHe will put His Spirit in thee."
  },
  "187": {
    "title": "We Are a Christian Squadron",
    "lyrics": "We are a Christian Squadron,\nAs rear guard goeth the Lord;\nAnd to fight, yea, I go\nTo defend with Him\nThe Gospel of Love.\n\nCHORUS: Now we are preparing\n To fight for Him;\nAnd the Lord is helping us,\nTo fight,\nFor the Holy One of Israel.\n\nChrist Jesus within us\nIs a shield without peer;\nTo fight with Him\nAgainst all wickedness,\nTo conquer iniquity.\n\nChrist Jesus is giving\nCourage to the people of the Lord;\nTo proclaim everywhere\nThe glad tidings of salvation,\nAnd speak of Christ the Saviour.\n\nWe will not fear, brethren,\nChrist Jesus will help us;\nThus He promised us,\nTrust ye in His power,\nFor His promises He will fulfill."
  },
  "188": {
    "title": "The Faithful Soldiers of God",
    "lyrics": "The faithful soldiers of God\nGo against the infernal Dragon;\nFor Jesus goeth with them,\nAnd the enemy He will defeat.\n\nCHORUS: Faithful soldier of the Saviour,\nThou who hast fought for the truth;\nCome rejoice with thy Lord,\nThroughout all eternity.\n\nFaithful soldiers of Jesus,\nNever cease ye from battle;\nWielding the armor of light,\nAnd the victory Jesus will give us.\n\nIf the devil seek to deceive thee,\nWith words of falsehood;\nThou must resist him trusting in Christ,\nAnd the demon shall flee.\n\nWhen thou comest unto the Mansion,\nAnd the triumph thou already hast won;\nJesus Christ, the King of Zion,\nA crown upon thy brow shall place."
  },
  "189": {
    "title": "Valiant Soldiers in the Fight",
    "lyrics": "Valiant soldiers in the fight,\nProclaiming Christ the Lord;\nAnd full of confidence they say,\nThat God is Love.\n\nCHORUS: The parched ground blossometh,\nWith the water of salvation;\nAnd the seed groweth,\nIn the Grace of Jesus.\n\nThe fields that the enemy holdeth,\nVery soon shall belong to the Lord;\nThe hosts of Jesus the Christ\nShall conquer them.\n\nFear not, valiant and faithful soldier,\nFor thou hast a mighty guide;\nThe weapons that Jesus hath given thee\nShall make thee a conqueror.\n\nThe souls held captive by sin\nShall hear the Message of Love;\nThrough Christ, who was sacrificed,\nThey shall have forgiveness."
  },
  "190": {
    "title": "Arise, Royal Vanguards",
    "lyrics": "Arise, ye royal vanguards,\nStand up, ye youthful hosts;\nFollow after the Master;\nThe King, Captain, and God;\nIt is time to depart,\nVanguards of Jesus;\nThe homeland eagerly seeketh\nA Saviour and God.\n\nCHORUS: Sow the Message of the Redeemer,\nFulfill the commandment of thy King,\nTurn not back in thy labor,\nAnd go unto the lost youth.\nSpeak unto them of Jesus,\nHealing for their sorrow;\nAnd render eternal glory\nUnto the Saviour and King.\n\nArise, ye royal vanguards,\nStand up, ye youthful hosts;\nGo to the unredeemed world;\nOf the Son of God speak.\nThe sharp adversity,\nUnconquered to subdue;\nAnd let a song of triumph\nBe heard to resound.\n\nArise, ye royal vanguards,\nOf the redeemed hosts;\nProclaiming of His Grace,\nThe glad tidings of Salvation.\nLet us declare with zeal,\nThat Christ hath saved us;\nFor the contrite sinner\nHe desireth to redeem."
  },
  "191": {
    "title": "Let Us Fight as Faithful Servants of God",
    "lyrics": "Let us fight,\nAs the faithful servants of God;\nAnd defend the cause of the Lord,\nFor today the LORD Jehovah\nIs upon our side;\nLet us fight\nFor Him, O people of Israel,\nFor the victory He will give us.\n\nCHORUS: Whosoever shall lose his life here,\nYonder with Christ shall find it;\nWhosoever dieth fighting thus,\nBy Jesus Christ shall be raised again.\n\nWhosoever as a faithful\nSoldier shall fight,\nAnd be valiant in the battle\nFor the faith;\nMust be well clothed with righteousness\nAnd power,\nAnd the triumph he shall obtain\nThrough Christ the Saviour,\nBy His mighty power he must overcome.\n\nFear not, for with us\nIs the Lord,\nStrength is with us,\nHe is the Captain,\nHe is our guide,\nLet us fight for Him, O people\nOf the Lord;\nFor victorious He will bring us through."
  },
  "192": {
    "title": "Christ Invites Me to Go with Him",
    "lyrics": "Christ invites me to go with Him\nUnto the mansion He went to prepare;\nThere He offereth a place for me,\nWhere throughout ages I may abide.\n\nCHORUS: Christ, Christ;\nWorthy Heavenly Father;\nGod of mercy,\nGod of goodness.\n\nChrist calleth me with all His Love:\nCome to My arms, come today, sinner;\nWhile I am calling, hearken to My voice,\nAnd yonder in heaven I will give thee rest.\n\nChrist calleth thee to come unto Him,\nTo receive that heavenly gift;\nThat thou mayest reign through endless ages\nIn the mansions He went to prepare."
  },
  "193": {
    "title": "One Day",
    "lyrics": "One day when heaven His glory was singing,\nOne day when evil reigned all the more cruel,\nJesus descended,\nAnd born of a Virgin,\nDwelling in the world,\nHe gave us a faithful example.\n\nCHORUS: Living He loved me, dying He saved me,\nAnd in the sepulchre He buried my sin;\nRising again He gave righteousness to me,\nOne day He cometh, for He promised it.\n\nOne day they led Him,\nUnto Mount Calvary,\nOne day they bore Him upon a cross,\nSuffering sorrows and penalty of death,\nJesus gave Himself for my eternal ransom.\n\nOne day they left Him,\nAlone in the garden;\nOne day the tomb,\nHis body enclosed,\nThe angels over Him,\nKept silent vigil,\nThus it was that the Lord of the world slept.\n\nOne day the Sepulchre,\nCould not conceal Him;\nOne day the Spirit,\nTo the body returned,\nHaving death forever,\nOvercome, at the right hand,\nOf the Father, Jesus sat down."
  },
  "194": {
    "title": "The King Is Coming",
    "lyrics": "The marketplace has now grown silent,\nThe noisy bustle ended is;\nThe workshops all have closed their doors;\nThe harvest fields are left behind,\nIn the houses work has ceased,\nIn the courthouses is no law,\nThe earth is now made ready,\nTo receive the coming King.\n\nCHORUS: Oh, the King is coming,\nThe King is coming;\nThe great trumpet now hath sounded,\nAnd His face I now behold,\nOh, the King is coming,\nThe King is coming,\nGlory to God,\nHe is coming for me.\n\nUpon the smiling faces,\nOf those who know the truth,\nAre seen redeemed lives,\nThat now have liberty,\nLittle children and the aged are seen,\nWho once suffered grief and pain,\nThey have now both health and joy,\nThanks unto their Redeemer,\n\nI hear chariots that rumble,\nFor they come now to announce;\nThe victory of life,\nAnd the end of all evil,\nRoyal robes are now distributed,\nThe grandstand standeth ready,\nAnd the great choir of the heavens,\nSingeth grace and love and peace."
  },
  "195": {
    "title": "Thou Needest to Be Reconciled with God",
    "lyrics": "Thou needest to be reconciled unto God,\nCommunion thou must seek with Jesus;\nBecause thou needest faithful approval,\nWhich cometh from heaven through Christ the Lord.\n\nCHORUS: God provideth the means for the sinner\nWho with all his soul, seeketh his Lord;\nIf thou hearest His voice and wilt follow,\nIf dead thou art found, He maketh thee live.\n\nIn Jesus Christ there is forgiveness of sins,\nHe ever hath compassion on the sinner;\nHe never despiseth him when he cometh to Him,\nHe lendeth him His help that he may be faithful.\n\nToday Jesus Christ in love doth call thee,\nHe stretcheth forth His hand to make thee live;\nOpen unto Him the doors of thy heart,\nBe of those who long today for His salvation.\n\nThere is no other Name that can save thee,\nOnly the Name of Jesus thy Lord.\nHe hath compassion seeing the affliction\nOf those who seek Him with all the heart."
  },
  "196": {
    "title": "Fear Thou Not",
    "lyrics": "Fear thou not that Christ will despise thee,\nChrist Jesus despiseth not the sinner;\nGreat is His love toward those who repent,\nCome unto Jesus; He will be thy Saviour.\n\nCHORUS: The bruised reed He will not break,\nNeither shall the believer perish;\nFor he is already born of God,\nAnd nothing shall separate him.\nJesus will raise up the fallen,\nAnd the afflicted He will comfort;\nTo him that hath no strength left,\nHe will multiply his might.\n\nThe good Saviour is calling unto every man,\nUnto the sinner who is found in wickedness;\nAnd if thou also hast need of His Grace,\nCome to the Lord, despise not His goodness.\n\nOf the Kingdom of God, Jesus Christ is the door,\nIf the sinner repenteth, therein he shall enter;\nIf he forsaketh error, being faithful unto death,\nChrist Jesus, a welcome will give him."
  },
  "197": {
    "title": "In the Darkness the Light Hath Shined",
    "lyrics": "In the darkness the light hath shined,\nWith its brightness it illumined my heart;\nNow I walk without stumbling upon a stone,\nBecause the Lord with His light hath enlightened me.\n\nCHORUS: The people that sat in darkness\n Saw a great light.\nAnd unto them that sat in the region\nAnd shadow of death,\nLight hath dawned upon them,\nFrom that thick darkness my Jesus,\nFrom that thick darkness brought me forth.\n\nTo enlighten the darkness God formed:\nThe sun and moon and stars He also created;\nAnd divine light for sinners,\nIn our souls also hath shined forth.\n\nArise, shine, for it hath come,\nThe light of Christ Jesus our Saviour;\nAnd thou shalt enlighten as the light of the dawn,\nAnd thou shalt shine as the sun shineth."
  },
  "198": {
    "title": "March with Joy, O People of the Lord!",
    "lyrics": "March on with joy,\nO people of the Lord;\nWith praises and glory\nUnto the Creator.\nBehold Christ who humbly\nDoth invite us,\nThat thou mayest delight thyself\nIn the banquet of love.\n\nCHORUS: This is the people,\nWhom God had chosen.\nThey were scattered abroad\n Throughout the world and in error;\nNow Christ in His mercy,\n Hath gathered them,\nCome, delight thyself,\nIn the banquet of love.\n\nIf thou wilt come unto Jesus Christ,\nForsake this world of deceit\nAnd corruption;\nCome humbly to the feet\nOf Jesus Christ, enjoy His grace,\nHis love and His pardon.\n\nAll of the saints\nWho enjoy this blessedness,\nLeft all behind\nTo follow their Lord;\nThis banquet\nIs a remembrance of His death,\nAnd a memorial\nOf His blessed passion."
  },
  "199": {
    "title": "Jesus the King... The Holy One of Israel",
    "lyrics": "Jesus the King... The Holy One of Israel,\nCalleth thee today... He desireth to forgive thee;\nHe giveth thee power and thus thou canst overcome,\nAnd thou shalt sing: Glory to Him! Glory to Him!\n\nCHORUS: Oh, what joy\nFeeleth the Church of God!\nThe King of glory cometh...\nHe cometh with great glory\nFor those whom He saved;\nSing unto Him songs of love,\nPraise Him, ye peoples of God,\nPraise ye Him, praise ye Him,\nForever, Amen.\n\nHis love is now... Fulfilling today its mission,\nIn rescuing... Man from error,\nWithout fainting thou canst rejoice with Him,\nAnd thou shalt sing: Glory to Him! Glory to Him!\n\nTo live, to rejoice... Yonder in eternity.\nA faithful promise... From Jesus Christ the King,\nHe will fulfill it because the Lord is faithful,\nAnd thou shalt sing: Glory to Him! Glory to Him!"
  },
  "200": {
    "title": "Upon a Cruel Cross, a Cruel Cross",
    "lyrics": "Upon a cruel cross\nJesus died there;\nHe died for thee and for me,\nTo give us full light.\n\nCHORUS: //: Come to the light,\nUnto Jesus:\nJesus awaits thee,\nCome to the light: //\n\nThe blood of Jesus\nAnd refulgent light,\nShall give thy salvation;\nShall come into thy heart.\n\nDraw near unto the altar,\nThere Jesus is;\nHe desireth to forgive thee,\nAnd give thee full light."
  },
  "201": {
    "title": "Jesus Came to Samaria",
    "lyrics": "Jesus came unto Samaria,\nAnd sat down beside the well;\nManifesting forth His glory,\nUnto a woman He did speak.\n\nCHORUS: Come to Jesus and partake of\nThe water of life;\nHe shall satisfy thy soul\nWhich wandereth lost;\nCome to the Lord,\nHe will give thee comfort,\nCome, come unto Him,\nGive Him thy heart today.\n\nWater He asked of the woman,\nOf that which she came to draw,\nAnd without making her perceive;\nHe began with her to speak.\n\nHow, being Thou a Jew,\nDost ask a drink of me,\nSeeing that one is held unclean\nUnto the people of Israel?\n\nI am the water of life,\nWhich calmeth all suffering;\nAnd if thou wanderest lost,\nDrink, and be born again."
  },
  "202": {
    "title": "Thou Art Drifting on the Sea",
    "lyrics": "Thou art drifting on the sea,\nWhere thy vessel wrecked may be;\nThou art drifting, slowly drifting more and more;\nLo, the tide will sweep away,\nThy frail bark beyond the bay;\nThou art drifting, slowly drifting more and more.\n\nCHORUS: Thou art drifting more and more,\nOn the stormy, tempest sea,\nThou art drifting on;\nFrom a Father's loving care,\nUnto death and dark despair,\nThou art drifting, slowly drifting more and more.\n\nLo, those lighthouses that shine\nWarn thee of thy peril now;\nThou art drifting, slowly drifting more and more.\nFar beyond the harbor bar,\nWill thy little bark be borne,\nThou art drifting, slowly drifting more and more.\n\nLo, those voices from the home,\nWeary grow of calling thee;\nThou art drifting, slowly drifting more and more.\nO my brother, hear that voice,\nThat sweet voice will rescue thee,\nEre thou drift away forever more and more."
  },
  "203": {
    "title": "Two Ways Lie Before Thee",
    "lyrics": "Two ways lie before thee… which wilt thou pursue?\nFor today is the season to make thy decree;\nThe one leadeth onward to Christ Jesus the Lord,\nThe other departs from His presence and light.\n\nCHORUS: Which wilt thou pursue? Which wilt thou pursue?\nTwo ways lie before thee, which wilt thou pursue?\n\nTwo ways lie before thee, the strait and of light,\nWhere the footsteps of Jesus our Saviour shine bright;\nThe other, though broad, hath no shepherd or stay,\nIt leadeth to death, unto sorrow and pain.\n\nThe narrow is filled with distress and with strife,\nWith heavy-borne crosses and denial of life;\nThe Son of Man promiseth aid from above,\nAnd to crown all the faithful at last in His love.\n\nTwo ways lie before thee, thou surely must choose;\nDecide now in haste, wilt thou thy soul lose?\nOh, choose thou the good one, that leadeth to Christ,\nAnd turn from the evil, forsaken of light."
  },
  "204": {
    "title": "This Flock of the Good Shepherd",
    "lyrics": "This flock of the blessed Good Shepherd,\nDoth bear now a seal in the heart,\nThe seal of the Holy Comforter,\nGlory to the Son of God!\nWith His blood He hath set us free.\n\nCHORUS: The death of the cross He endured,\nTo give unto us life He humbled Himself,\nCruel shame and reproach He sustained;\nGlory to Christ, my Saviour blest,\nFor His love!\n\nIn the beginning was the Word,\nAnd the Word was with God;\nAnd the Word was truly God Himself,\nHe is Alpha and Omega,\nThe beginning and also the end.\n\nBecause His own people rejected Him,\nA stranger folk received Him,\nA people not of His fold;\nHe made them the sons of God,\nSince they in His Name believed.\n\nThe thankless people derided Him,\nThe faithful Lamb answered them not;\nUnto His people my Saviour came,\nA faithless folk tormented Him,\nNot knowing He was the Good Shepherd."
  },
  "205": {
    "title": "The Saviour Came to Suffer",
    "lyrics": "The Saviour came down,\nHe came here to suffer;\nTo pour out His blood,\nFor thee and for me.\n\nCHORUS: Perchance tomorrow there will be\nNo room, there will be no room;\nChrist saith to thee:\nCome without delay, the day is passing,\nThe night draweth near,\nPerchance tomorrow will be too late.\n\nChrist is calling to thee,\nThat thou mayest hear His tender voice;\nWith longing He calleth to thee,\nSaying unto thee: “Come unto Me.”\n\nWait not until tomorrow,\nTo come to thy Lord;\nBecause on tomorrow,\nToo late it will be, O sinner.\n\nThere in the chilly tomb,\nThou wilt not be able to plead;\nUnto Christ, the King of glory,\nWho today desireth to save thee."
  },
  "206": {
    "title": "Let Us Be Sober Always",
    "lyrics": "Let us be sober, watching always,\nAnd holiness ever pursue;\nFor Jesus Christ cometh soon to the world\nTo give us salvation full and true.\n\nCHORUS: Christ doth invite thee, hear thou His voice,\nDespise Him not, neither faithless be;\nTarry no longer, come quickly now,\nFor He desireth to give thee\nAlso thy liberty.\n\nThe chosen ones are cleansing themselves,\nFor soon the Lord cometh again;\nTo await Him fulfilling with all their heart\nHis holy and blessed will.\n\nLet us be holy as He is holy,\nForsaking all manner of sin;\nThat when He cometh He may find us pure,\nOnly waiting redemption to win.\n\nCome running swiftly if we desire,\nAnd let us proclaim liberty;\nFor Jesus Christ cometh now to the world,\nAll that was written fulfilled shall be.\n\nNo further signs do we seek to behold\nOf the coming of the righteous Judge;\nWe only await the day and the hour,\nFor He hath said: “I will come again.”\n\nYe newly-come souls who visit this day\nThe holy flock that He bought with blood;\nCome, be ye saved, for now is the time,\nBelieve that Christ hath all power and might."
  },
  "207": {
    "title": "Come to Christ Jesus",
    "lyrics": "Come unto Christ Jesus,\nHe is thy good Saviour,\nToday He desireth to free thee\nFrom ruin and lost estate;\nToday is the time when thou mayest\nObtain full forgiveness;\nUnto thy soul He will give salvation.\n\nCHORUS: Tarry no longer,\nCome to the Saviour;\nThat thou mayest receive\nFrom Him salvation,\nIn Christ alone findest thou\nThis day life eternal,\nAnd salvation thou shalt find.\n\nToday is the time thou mayest come,\nO sinner, come near,\nThe coming draweth nigh\nOf Christ the Lord;\nIf thou wilt accept Him\nWith all of thine heart,\nUnto thy soul He will give salvation.\n\nOh! how mournful 'twill be\nFor every one\nWhose name is not found\nWritten in His book;\nTo the voice of Jesus\nHe will not be able to reply;\nToday He calleth thee to obey."
  },
  "208": {
    "title": "Incomparable Love",
    "lyrics": "Incomparable love our God hath displayed,\nMatchless love hath the Lord shown to man,\nSending forth His beloved Son unto us\nTo bring us salvation, a Father's own love,\nA love without peer.\n\nCHORUS: What God is so near unto us as the Lord\nJesus,\nWhose presence is felt, whose power is seen,\nWhose love is perceived, and His virtue so great.\n\nLove for our souls did our God demonstrate,\nHe willed not that what He had fashioned should die;\nBeholding us lost, He had pity on us;\nShowing forth His great love, He imparted us life.\n\nA friend's tender love did the Saviour display,\nThus showed He His love and His sovereign power;\nHe willed not that any of His should be lost,\nThe fatherly love of the God of Israel."
  },
  "209": {
    "title": "Oh, My Heart Is Overflowing",
    "lyrics": "Oh, my heart o'erflows with joy and holy gladness,\nFor the Lord forgave me in His wondrous love;\nAnd in serving my sweet Jesus I am happy,\nI am going where my Saviour reigns above.\n\nCHORUS: I am climbing up to heaven on the golden stair,\nI am climbing, where a crown awaits me there,\nI am climbing in fair light,\nI am climbing with Jesus;\nPraises will I sing to God up there;\nI am climbing up to heaven on the golden stair,\nI am climbing, where a crown awaits me there;\nI am climbing in fair light,\nI am climbing with Jesus;\nI am climbing to my heavenly home above,\nI am going with Christ to my heavenly home.\n\nEvery day I would love Him more constantly,\nEvery day I would be more faithful unto Him;\nAided by His grace that richly and abundant\nIs bestowed by our Father in heaven above.\n\nI find joy in bringing weary sinners to Him,\nRich or poor, of whatever station they may be,\nUnto Jesus who on cruel cross bore sorrows,\nTo provide for all salvation full and free."
  },
  "210": {
    "title": "Great Is Jehovah",
    "lyrics": "Great is Jehovah,\nAnd greatly to be praised,\nIn the city of our King,\nIn the mountain of His sanctuary;\nWorthy is Jehovah\nTo receive all honour due,\nFor He came to set us free\nFrom the dragon's cruel claws.\n\nCHORUS: Beautiful for situation,\nThe joy of all the earth,\nIs the holy Mount of Zion,\nThe city of the great King.\n\nShout aloud unto God,\nAnd sing unto His holy name;\nSay unto God: I give Thee praise,\nFor Thou alone hast saved my soul;\nGreat is Jehovah,\nAnd matchless is His power;\nO hallelujah, Jesus, I adore Thee,\nAnd I give Thee all my heart.\n\nOh, how sweet and pleasant 'tis\nTo sing unto the King of kings,\nIn communion and in love,\nIn the church of the faithful Lamb,\nAll possessing the gift\nOf the Spirit of our God,\nAll with joy forever praising\nJesus Christ, the blest Good Shepherd."
  },
  "211": {
    "title": "Forward, People of the Lord Jesus",
    "lyrics": "Forward, people of the Lord Jesus,\nLet us go with love;\nThere is power, there is power in God,\nYea, we shall have victory,\nIn the name of the Lord.\n\nCHORUS: Even now we see the dawning\nOf that day of glory bright,\nWhen all eyes shall Him behold,\nThe great coming of the Lord;\nLo, amid the clouds He cometh,\nTo catch up His church on high.\n\nForward, people of the Lord Jesus,\nWe shall triumph now;\nIn this battle we shall win the day,\nLet us fear not, brethren,\nFor the Lord will help His own.\n\nForward, all in the love of God,\nChrist goeth before;\nHe His help, He His help will grant to us,\nAnd right soon we shall be standing,\nThere beholding His blessed face."
  },
  "212": {
    "title": "Christ Is the Door to Enter In",
    "lyrics": "Christ is the door whereby to enter\nInto the kingdom of the skies;\nIf thou desirest to partake,\nDepart from all iniquities.\n\nCHORUS: Which pathway dost thou tread?\nAnd if resolved thou art,\nThou knowest that to Jesus Christ\nAn answer thou must give;\nWhich pathway dost thou tread?\n\nTwo ways there are that lead along\nUnto eternity:\nThe narrowest is the way of God,\nAnd broad is Satan's company.\n\nAlong the narrow path is grief,\nTrials and sore temptation;\nHe that o'ercometh, he shall reign\nWith Christ in heavenly mansion.\n\nUpon the broad way only walk\nAll those that work iniquity;\nTheir recompense they too shall have\nWithin the lake of misery.\n\nCome to the Lord, be not untrue,\nSurrender Him thine heart;\nThat thou mayest from Jesus Christ\nReceive the great reward."
  },
  "213": {
    "title": "Today Jesus Christ Is Calling",
    "lyrics": "Today Jesus Christ is calling now\nTo the sinner in distress,\nHe calleth him to come with Him\nUnto eternal rest;\nWithin His mansions fair above\nA place He doth prepare;\nCome unto Him, sinner, today,\nDespise not His sweet grace.\n\nCHORUS: Come to Him, sinner, come,\nToday come to Him, sinner, come,\nThe Lord is calling thee\nUnto His blessed rest;\nCome to Him, sinner, come,\nToday come to Him, sinner, come,\nThy sins and all thy guilt\nHe longeth to forgive.\n\nIf thou art weary of thy sin,\nNow, O sinner, come away;\nToday Jesus Christ calleth thee\nTo enter into rest;\nIf thou art sorrowful, He comes\nTo comfort all thy grief;\nCome unto Him, sinner, today,\nDespise not His sweet grace.\n\nI am a witness for my God,\nO sinner, hear my plea;\nI was a wanderer once, and lost\nIn paths of grievous error;\nAnd the Lord with power delivered me,\nNow give I glory and honour due\nUnto Jesus my Redeemer.\n\nAnd when we enter, thou and I,\nInto that mansion blest,\nWe shall behold the glory bright\nOf our eternal Lord;\nWe shall no longer suffer there,\nNor shall there be any pain;\nThere it will be unmingled joy,\nJoy beyond all compare."
  },
  "214": {
    "title": "What Great Joy I Felt",
    "lyrics": "What Great Joy I Felt,\nWhen I was baptized,\nI felt that my soul\nWas ransomed from iniquity;\nWith gladness my heart did overflow,\nOh, what great happiness!\nBlessed be my Christ unto eternity.\n\nCHORUS: Now I can cry aloud that I am free,\nNow I can sing aloud that I am saved;\nHallelujah to my Saviour!\n\n'Twas a happy day for me,\nWhen I did receive\nThe wondrous message of the gospel\nOf the Saviour;\nThey told me of a slain Lamb of God,\nWho died for this soul of mine;\nAnd straightway with joy, I came unto my Lord.\n\nNow can I truly say\nThat I was redeemed\nBy Jesus Christ\nIn the baptism that I received;\nI feel that by Jesus I am now ransomed,\nBecause I was born anew,\nAnd a new creation, by grace I was made."
  },
  "215": {
    "title": "Finding Me Lost",
    "lyrics": "Finding me wandering and lost,\nWithout any hope of relief,\nChrist Jesus found my soul;\nAnd He reached forth His hand of\nMercy, and gathered me in;\nIn my great waywardness,\nWhere I was bowed down in distress,\nChrist Jesus, my Lord and my King,\nDid save me with His tender love.\n\nCHORUS: Jesus Christ, the blest Good Shepherd,\nCame down to seek the lost,\nHe left His throne of glory,\nTo come and seek,\nThe lost ones,\nAnd the lost He found.\n\nI came not to destroy the souls,\nOnly came I to save them,\nSaid Christ the Saviour;\nTo seek that which was lost,\nHave I come;\nI came not of Myself,\nBut in the Divine counsel,\nIt pleased my Father,\nThat I should come unto him that was lost.\n\nI was like the coin that was lost,\nUpon the earth I had no worth,\nAnd my Lord, beholding my misery,\nLifted me up;\nGiving His life upon the cross,\nUpon that rugged tree, with His blood He\nCleansed me;\nI give thanks unto God because He saved me."
  },
  "216": {
    "title": "God Hath Blotted Out My Sin",
    "lyrics": "Now God hath blotted out my sin,\nMy Saviour, Christ Jesus my Lord;\nHe paid for me my debt in full,\nAnd put away all my transgressions.\n\nCHORUS: Now God hath blotted out my sin,\nEnduring anguish deep and sore;\nO hallelujah to the Lamb of God,\nWho taketh and blotteth out the sin of the world!\n\nFor me He died upon a cross,\nFor me He suffered torment and pain;\nTo blot out the stains from my soul,\nAnd make His abode in my heart.\n\nThe witness He Himself hath given,\nImparting peace unto my heart,\nThat I may rejoice in His goodness,\nAnd have a portion in His mansion."
  },
  "217": {
    "title": "For Me to Live Is Christ",
    "lyrics": "For me to live is Christ the Lord,\nThe Holy Shepherd, Saviour good,\nAnd if I die for Him, 'tis gain to me.\n\nCHORUS: A strong tower is the name of God,\nAll ye with love, all ye with zeal;\nHearken unto His gentle voice.\n\nThe valiant in Christ shall take by force\nThe kingdom of peace, there to rejoice;\nThe Shepherd of heaven they there shall meet.\n\nCrowned shall they be, the faithful who now\nWith holy fervour give praise unto God;\nCeaselessly they'll sing in His holy mansion."
  },
  "218": {
    "title": "Sing unto Jehovah a New Song",
    "lyrics": "Sing unto Jehovah\nA new song of praise;\nTribute render unto Him,\nAll united with a single voice,\n/:/For good is He/:/\nJehovah our Maker.\n\nCHORUS: Sing, O sing unto our God;\nLet the redeemed proclaim:\nJehovah liveth! He liveth and reigneth!\nUpon His heavenly throne.\n\nSing unto Jehovah,\nAll ye saints who here today\nAre gathered together,\nTo worship Him with all the heart,\n/:/Unto the Lord Jehovah/:/\nWho dwelleth in the heavens.\n\nUnto Thee, O Lord,\nWe offer up our songs,\nAnd Thou dost receive them\nAs sweet perfume before Thy heavenly throne,\n/:/We give Thee praise/:/\nUnto Thee, O Redeemer!"
  },
  "219": {
    "title": "Christ Is a Spring of Pure Love",
    "lyrics": "Christ is a fountain of purest love,\nSpring whence floweth eternal life;\nWhere the sinner rested his weary mind,\nAnd is satisfied of his spiritual thirst.\n\nCHORUS: Christ is the Rock of Horeb\nThat watereth the desert land;\nAnd if thy soul is athirst,\nThou hast reached the Great Living Spring.\n\nChrist unto His people gave redemption,\nGiving His life a ransom for them;\nAnd washed them clean from all their sins,\nAnd by His death, gave them life eternal.\n\nFountain that watereth my soul with truth,\nUnfailing spring of purest love;\nWhere I have found the water of life,\nAnd quenched of its thirst was my heart."
  },
  "220": {
    "title": "There Is Life in Jesus",
    "lyrics": "There is life, life, life in Jesus,\nThere is life, life, life in Jesus;\nI desire to rejoice in the homeland above,\nThere is life, there is life in Jesus.\n\nThere is joy, joy, joy in Jesus,\nThere is joy, joy, joy in Jesus;\nI desire to rejoice in the homeland above,\nThere is joy, there is joy in Jesus.\n\nNow reigns, reigns the life in Jesus,\nNow reigns, reigns the life in Jesus;\nI desire to rejoice in the homeland above,\nNow reigns the life in Jesus.\n\nToday saves, saves Christ my Lord,\nToday saves, saves Christ my Lord;\nI desire to rejoice in the homeland above,\nToday saves, Jesus my Saviour."
  },
  "221": {
    "title": "In Sin Jesus Found Me",
    "lyrics": "In sin did Jesus find me,\nAnd gave me ransom, glory to Him!\nHe cleansed me from all iniquity,\nHe filled me with His Spirit.\n\nCHORUS:\nJoyful day when He found me,\nHe brought me out of darkness,\nHe cast my sins into the deep sea,\n\nAnd filled my soul with joy and peace;\nDay of rejoicing, O Hallelujah!\nA day of joy it was unto me,\nI will sing and cry, \"Hosanna in glory!\"\nWhen we are yonder with Him.\n\nDeliver me from every temptation,\nSave me from every persecution;\nDeliver me from all perdition,\nAnd I shall ever be faithful, Lord.\n\nWhen I am with Christ yonder in glory,\nWe shall sing in a Heavenly Choir;\nWe shall enjoy an eternal life\nWhen we are yonder with Him.\n\nForget me not, O God of my salvation!\nHelp me with Thy great power;\nMine enemy then shall I overcome,\nFor Thou art my Helper."
  },
  "222": {
    "title": "I Am Baptized in the Name of Jesus",
    "lyrics": "I am baptized in the Name of Jesus,\nIn the Name of Jesus, in the Name of Jesus:\nI am sanctified, my sins He blotted out\nBy the blood He shed upon the cross.\n\nCHORUS: Jesus Christ is the Name of my God,\nMy trust is in His power;\nTo press onward in His faithful way\nUntil I come to see Him.\n\nJesus Christ is the Name of my beloved Savior,\nHe gave me His protection in such great affliction;\nAs I was walking lost in darkness of error,\nHe gave me His shelter and forgiveness.\n\nJesus Christ is the Alpha, Omega, beginning and end,\nThe first and the last, and He who is to come;\nAnd according to our works, He must\njudge us\nIn that day of the Final Judgment.\n\nUnto His faithful redeemed who do His will\nHe will give their reward, the crown He will place upon them;\nAnd by the greatness of His grace He will give them\nThe Kingdom that is prepared.\n\nUnto all whom He shall find working iniquity,\nWith the voice of His fury the sentence He shall give them:\n\"Depart from My side, ye workers of iniquity,\nInto the fire that is prepared.\""
  },
  "223": {
    "title": "I Am Baptized as the Savior Commands",
    "lyrics": "I am baptized as the Savior commands!\nWhat great joy I feel in my heart!\nNow my sins my Savior hath blotted out,\nI would arrive clean and pure at His mansion.\n\nCHORUS: I will follow my Jesus,\nFor unto me the things of the world are ended,\nAnd aided by His light,\nTo press onward in His way do I desire.\n\nI look no more but to the way of faith,\nWhere very few have been able to walk;\nI pray to God that He keep me in love,\nI would arrive pure and clean at His mansion.\n\nFarewell, world, wherein until yesterday I dwelt,\nWhere sin was destroying my life:\nI feel joy since I was baptized,\nAnd to return to sin, 'twere better to die!"
  },
  "224": {
    "title": "Christ Is the Fountain of the Water of Life",
    "lyrics": "Christ is the fountain of the water of Life,\nFor the souls that would be saved;\nRepentant, coming unto His feet,\nHe their sins can forgive.\n\nCHORUS: O soul, wander not astray,\nHear the voice that calleth thee:\nCome to the fountain of life,\nFountain of love and truth.\n\nJesus Christ is the gate of heaven,\nHe is the way unto salvation;\nHe is the truth that enlighteneth souls,\nWhich repentant implore salvation.\n\nLost souls that are in the world,\nAnd weary upon the path of evil;\nChrist with a loving voice calleth them,\nIn His baptism they find liberty.\n\nLost souls that are in the world,\nAre lost in the shadow of iniquity;\nThe voice of Christ humbly calleth them,\nTo wash them clean from all iniquity."
  },
  "225": {
    "title": "I Lived in the World Without God",
    "lyrics": "I lived in the world without God,\nWithout hope and without faith;\nUntil on a certain night,\nUnto Christ I drew near.\n\nCHORUS: He hath blotted out mine iniquity now,\nHe will take no account of my sins;\nHoly even as He is,\nHe redeemed my soul.\n\nWith Christ I found holy peace,\nMy whole life He changed;\nHe is my eternal Rock,\nMy tender Savior.\n\nHe calleth the sinner,\nHe willeth not to see him in evil;\nFor him He suffered death,\nTo grant unto him forgiveness."
  },
  "226": {
    "title": "As Sheep Thou Leadest Thy People",
    "lyrics": "As sheep Thou leadest Thy people,\nAs Moses and Aaron did;\nAs the eagle spreadeth its flight,\nAs Christ giveth us salvation;\nAs the lightning from east unto west,\nAs the wind that swiftly bloweth;\nAs a sword it chastiseth and rebuketh,\nThe Blessed Word of God.\n\nAs the King with His laws ordaineth,\nAs heralds of peace and of love;\nAs the sun that spreadeth its beams,\nAs sweet fragrance the flower sheddeth;\nAs a lioness defendeth her whelp,\nAs time that swiftly fleeth;\nAs a sword it chastiseth and rebuketh,\nThe Blessed Word of God.\n\nIf thy soul cherisheth a hope,\nOf a life of joy and of love;\nPlace in Christ all thy trust,\nIn Jesus our King and Lord.\nIf thy life treadeth a straying path,\nOf darkness, of shadows of error;\nDespise not the Word of God,\nOf Jesus our King and Lord."
  },
  "227": {
    "title": "Pardon, My Lord!",
    "lyrics": "Pardon, my Lord, for Thy love's sake,\nOf Thee I ask this day, Holy God;\nUnto Thee, Redeemer of goodness,\nI surrender my soul;\nGrant me stillness, grant me peace.\n\nCHORUS: Unto Thee, my God, I pour out my soul,\nUnto Thee, my King, I present my being;\nMy being which without Thee may be lost;\nIn Thy presence\nI plead for mercy, grant me peace.\n\nMercy my soul entreateth of Thee,\nJesus, O Heavenly Shepherd!\nThy face doth illuminate my life;\nUpon Thy path,\nI have comfort, I have peace."
  },
  "228": {
    "title": "Those Who Have Found Life",
    "lyrics": "Those who have found life\nRejoice with their King;\nThey rejoice, they are glad,\nSinging praises unto Him.\n\nCHORUS: Fellowship, O yes!\nFellowship, O yes!\nWith Christ rejoiceth\nHis church today, O yes!\n\nBlessed seed of Christ,\nBless thou thy Lord;\nSinging praises,\nWith holy fervor.\n\nEnjoying life with Christ,\nAll suffering is forgotten;\nHow sweet and how holy\nIs our good King."
  },
  "229": {
    "title": "In Darkness My Soul Was Found",
    "lyrics": "In darkness my soul was found,\nWithout hope in the world did I live;\nWhile Christ with His voice was calling,\nBy His word He showed my future.\n\nCHORUS: Beauteous light that upon me shone,\nMy heart was able to find,\nWhen Jesus came and saved me;\nThen was He able to enlighten my soul.\n\nNow do I rejoice with them that rejoice,\nNow I sing with joy and gladness;\nNow I strive with them that strive,\nFor now Christ reigneth in my being.\n\nHappy moment when I felt\nThat Jesus Christ came and saved me;\nWhen His tender voice I came to know,\nMy heart with joy was filled."
  },
  "230": {
    "title": "Sweet Melodies I Will Sing",
    "lyrics": "Sweet melodies I will sing,\nAnd praises unto the Lord;\nUnto His Name glory I will give,\nFor His incomparable love.\n\nCHORUS: The Name of Jesus\nIs sweet unto me;\nMy soul doth sing\nMelodies unto my King.\n\nI lived in shadows and in grief,\nSorrowful, wounded, poor and vile;\nBut the tender hand of the Lord\nBrought me unto His fold.\n\nA perennial fount of grace I found\nBeneath the shelter of His love;\nHis smiling countenance imparteth faith,\nHope and great courage.\n\nThough through the valley of affliction\nI must pass while here below;\nMy Jesus shall grant His protection,\nHe will remember me.\n\nThe rosy dawn announceth now\nThat Jesus for me shall come;\nMy joyful soul with Him shall reign\nIn the celestial City."
  },
  "231": {
    "title": "Thou Knowest, Lord",
    "lyrics": "Thou knowest, Lord,\nHow unprofitable I am;\nThou knowest, Lord,\nHow imperfect I am.\n\nCHORUS: Increase my faith,\nAnd give me understanding,\nThat wheresoever I may walk,\nI may serve as an example.\n\nThou knowest, Lord,\nHow lacking in prayer;\nThou knowest, Lord,\nAll mine imperfection.\n\nIf Thou help me, Lord,\nMy flesh to overcome;\nIf Thou help me, Lord,\nWith Thy great power.\n\nIf Thou help me, Lord,\nI will persevere in Thy love;\nMake me meek and lowly,\nAnd pure in heart.\n\nLord, grant me Thy grace,\nThat I may triumph;\nSuffer me not to anyone\nTo render evil for evil.\n\nIf Thou help me, Lord,\nTo proclaim Thy Coming,\nAnd to tell the people\nThat Thou givest them life."
  },
  "232": {
    "title": "I Heard the Voice of the Spirit of God",
    "lyrics": "I heard the voice\nOf the Spirit of God,\nWhich vibrated\nIn a human being,\nChosen of God,\nAnd it pierced into my soul;\nA word spoken with charity\nReached unto my being and brought\nUnto my soul the gift of peace.\n\nCHORUS: Divine peace which my Lord did leave,\nIs that which I feel in my heart;\nAs a witness that God hath blotted out\nAll my guilt, and given me liberty.\n\nA day of rejoicing, when I heard\nHis sweet voice,\nAnd my soul, wandering in the world\nAnd in perdition,\nFelt a longing to partake of the joy\nWhich was in the soul\nOf him who spake unto me;\nAnd there was sown in my soul\nThe Word of the Kingdom of God.\n\nToday I stand firm in the grace of my God,\nKnowing that this world\nMust pass away;\nI will strive to be crowned\nWith stars and diamonds\nYonder in holy Zion;\nWherein dwelleth,\nIn fullness of grace,\nThe Lamb of God."
  },
  "233": {
    "title": "With Christ Is My Life",
    "lyrics": "With Christ is my life,\nAnd likewise will I deny myself,\nThat my soul may have entrance\nInto glory with my King.\nIn the day of His Coming,\nGreat joy shall be in my being;\nFor He shall come with His saints,\nTo raise up His flock.\n\nCHORUS: Upon His throne He shall sit,\nJudging the peoples with equity,\nAnd His own He will lift up,\nAnd unto the wicked thus will He say:\n\"Depart from Me,\nYe workers of iniquity.\"\n\nI was a straying sheep,\nBut Christ found me;\nBecause it was destined\nFor eternal salvation.\nIf thou wouldest partake,\nCome and ask Him for pardon,\nObey His Word,\nAnd thou shalt obtain salvation.\n\nThe great day is drawing near,\nWherein my Lord shall come,\nAnd we must await Him,\nBattling without ceasing.\nIn Ephesians chapter six, from twelve\nUnto eighteen, thou shalt find\nWhat thou oughtest to put on,\nTo go forth to fight.\n\nIf thou obeyest His Word,\nThe Lord will take thee\nTo enjoy His dwelling,\nUnto all eternity.\nIf thou art faithful unto death,\nThe crown He will give thee;\nThe reward that awaiteth thee,\nIf thou art faithful unto the end."
  },
  "234": {
    "title": "Lord, Thou Seest My Heart",
    "lyrics": "Lord, Thou seest my heart,\nMy way of thinking;\nAnd all my meditation\nThou canst already weigh.\n\nCHORUS: Search Thou my heart,\nBehold my thoughts;\nAnd see if there be any iniquity in me,\nAnd lead me in the way everlasting.\n\nMy thoughts and my speech\nThou knowest, O Lord;\nAnd wheresoever I may be,\nI receive Thy favor.\n\nIf on the wings of the morning I fly,\nBeyond the ends of the world;\nI know that in Thy presence I am,\nEven there Thy hand is.\n\nFrom Thee I cannot hide,\nThou followest after me;\nLight and darkness alike\nAre both the same to Thee.\n\nBe Thou, O Lord, my Righteous Judge;\nWith Thee I long to go;\nTo be with Thee is my desire,\nFrom Thee never to depart."
  },
  "235": {
    "title": "Unto Christ I Desire to Serve",
    "lyrics": "Unto Christ I desire to serve,\nAs long as I have life to live;\nBe Thou my Helper, O Lord;\nThou art my God and Savior.\n\nCHORUS: With Thee will I live,\nNevermore shall I suffer;\nThou art the refuge of the poor,\nTherefore Thee will I praise.\n\nThou art the refuge of the poor,\nFirm foundation of His love;\nTherefore do I praise Thee, Lord,\nFor Thy goodness that saved me.\n\nLost and wandering was I,\nYet Thy love set me free;\nThy death on the cross gave me life,\nI will praise Thy Name here below.\n\nWhen the battle is ended,\nAt Thy side I shall be;\nWith Thee I will live and rejoice,\nWhere Thou art, there shall I be found."
  },
  "236": {
    "title": "Blessed Shall Be the Man",
    "lyrics": "Blessed shall be the man\nWho never walketh in the ways of evil,\nWho stood not in ungodly gathering,\nNor sat in the seat of the scorner.\n\nCHORUS: Blessed shall he be among the flock,\nWhose desire is to find delight,\nHappy is he who discerneth God and His Law:\nThe grace of Christ shall save him.\n\nHe shall be like a tree of great vigor,\nWhich by the rivers is made fruitful;\nIts fruits in season and pleasant verdure,\nAnd whatsoever he doeth shall prosper.\n\nThe ungodly, however, like chaff shall be,\nSwept from the earth across all its face;\nThus the ungodly shall not stand\nWith the just and holy in judgment ever.\n\nThe path of the righteous Jesus shall keep,\nFor He knoweth it with great perfection;\nThe wicked on his path shall meet his end,\nHe shall surely have final destruction."
  },
  "237": {
    "title": "We Have Great Joy",
    "lyrics": "We have great joy\nIn the fold of Christ the Lord,\nRejoicing today in the presence\nOf the Spirit of God.\nUnited all as one,\nWe bless the Creator;\nUnto the great Lord of lords:\nPraise, praise, praise!\n\nCHORUS: All united with one voice,\nSing ye unto Christ:\nPraise, praise, praise!\n\nThe angels of heaven\nDay and night give Thee praise,\nSaying, \"Holy, holy,\nHoly forever art Thou, Lord.\"\nThy children upon earth\nPraise Thee today with fervor;\nUnto Thee, my eternal Father:\nPraise, praise, praise!\n\nLamb meek and lowly,\nThy sweet goodness hath reached us;\nShepherd of our souls,\nWith Thee we shall not want.\nThou art the light that shineth\nAlong the path of love;\nUnto Thee we will ever give:\nPraise, praise, praise!"
  },
  "238": {
    "title": "Revive Our Fragile Being",
    "lyrics": "Revive our fragile being,\nAnd we will sing of Thy goodness;\nAs we run along Thy paths,\nChrist, pour out Thy tender mercy.\n\nCHORUS: Come, Lord, to give light,\nWith power to encourage;\nCome, Lord, to teach\nThy flock Thy commandments.\n\nEven as a wandering sheep was I,\nOn the vile path of perdition;\nRestore my soul unto Thee,\nGuide my feet to Thy mansion.\n\nI stretch forth my hands unto Thee now,\nAsking for fatherly grace;\nEven as a thirsty land\nFor fresh celestial rain.\n\nCome in mercy, my Savior,\nTo search my heart;\nAnd for Thy Name and Thy love's sake,\nDescend to redeem my soul.\n\nThine, O my God, is my will;\nThy holy Law Thou wilt teach me;\nIn the path of equity\nAnd righteousness Thou wilt lead me.\n\nLet Thy light of blessing shine,\nGrace and mercy shall illumine\nWithin my soul and heart,\nWhich from Thy hand they shall receive."
  },
  "239": {
    "title": "O Beloved Christ!",
    "lyrics": "O beloved Christ,\nBlessed Savior;\nFor Thee have I left\nThe path of error;\nI desire to serve Thee,\nFor Thou didst love me:\n/:/If before I loved Thee not,/:/\nLord, now I do.\n\nCHORUS: And on reaching heaven,\nThus shall I sing:\n/:/I was vile, unworthy,/:/\nYet Christ saved me.\n\nI love Thee, Jesus,\nBecause in Thine infinite love,\nThou didst bear contempt,\nShame and sorrow;\nChorus: Crown of thorns\nDidst Thou bear for me;\n/:/If before I loved Thee not,/:/\nLord, now I do.\n\nIn life and death,\nI will ever love Thee,\nAnd with songs of praise\nMy voice I will raise.\nBecause on a tree\nThou didst die for me:\n/:/If before I loved Thee not,/:/\nLord, now I do.\n\nIn that holy dwelling\nOf eternal joy,\nUnto Christ Jesus,\nThe immortal Lamb,\nForever will I sing;\nOh, what joy it is for me!\n/:/If before I loved Thee not,/:/\nLord, now I do."
  },
  "240": {
    "title": "Glorious Day, When I Heard Thy Voice",
    "lyrics": "Glorious day, when I heard Thy voice,\nThou spakest to my soul with tender and sweet love;\nThen, Father, with my soul deeply moved,\nSurrendered unto Thee, I asked for Thy pardon.\n\nCHORUS: Today the peace that floodeth my being\nIs a witness of Thy forgiveness;\nGod alone was able to save me,\nAnd rest unto my soul to give.\n\nWithout hope I wandered in the unfaithful world,\nAnd unto wickedness I gave my eternal being;\nAnd lost was I in sin and in disdain,\nPeople despised me everywhere.\n\nI understood not in my wicked heart\nThat God would remove from man the curse;\nToday by His grace, which hath reached me,\nNailed to the cross,\nWith His blood He purchased me.\n\nToday is my longing near to Christ to be,\nAnd with the saints into the kingdom would I enter;\nI know that in the Kingdom, forever happy is one,\nNo more anguishes, neither tears shall be."
  },
  "241": {
    "title": "We Are Saved by Faith",
    "lyrics": "We are saved by faith,\nWe are saved through Jesus Christ;\nHis love He gave;\nNow we sing with one accord,\nAnd with all our heart;\nFor me He died.\n\nCHORUS: Lord, O Lord, my Shepherd Good,\nHere behold Thy gathered flock,\nFolded in Thy love;\nThy faithful folk,\nSend us peace, and send us light;\nMay Thy Spirit all-divine,\nThe great Comforter,\nCome today, O Lord.\n\nThee we worship, O Jesus!\nWith profoundest gratitude;\nMy Redeemer;\nGrant us now Thy blessing, Lord,\nAnd Thy holy shield and care,\nMy Shepherd Good.\n\nGrant us in Thine endless love,\nSpiritual food from above,\nBread of God,\nReady is to hear Thy word,\nThis great multitude,\nThou seest, Lord."
  },
  "242": {
    "title": "When I Reach the Final Goal",
    "lyrics": "When I reach the final goal,\nAnd my earthly race is run,\nWhen at last I enter rest\nIn the heavenly homeland blest,\nWhen I reach the final goal,\nAnd the prize at last I hold,\nI shall see my blessed Lord\nIn His beauteous mansion fair,\nWhich Himself went to prepare.\n\nCHORUS: When I finish all my race and stand\nMore than conqueror,\nNow I see the waiting prize,\nI will strive with all my love.\n\nWhen I reach the final goal,\nAnd perceive that I have overcome,\nWhen by grace I have a home,\nFull of rest and sweet repose;\nWhen the prize I may attain,\nAnd to enter into rest,\nIn the eternal home, in the Holy City fair,\nWhich prepared already stands.\n\nWhen by grace I may receive\nThat delightful prize that waits for me,\nWhen I reach the final goal,\nAnd my earthly race is run,\nWhen I gaze upon the Lamb of God\nWho upon His throne doth reign,\nEncompassed with splendor, I'll see my Redeemer,\nIn mighty power and majesty."
  },
  "243": {
    "title": "If Ye Then Be Risen",
    "lyrics": "If ye then be risen,\nSeek those things which are above;\nWhere Christ sitteth on the throne,\nAt the right hand of the Heavenly Father.\n\nCHORUS: Seek those things which are above,\nAnd not the things of the earth;\nFor ye are dead,\nAnd your life with Christ is hid.\n\nIf ye then be risen,\nLet us put away all sin;\nAnger, wrath, and every malice,\nAll uncleanness and excess.\n\nIf ye then be risen,\nLet us live in holiness;\nLearning from the blessed Master\nMeekness and humility.\n\nIf ye then be risen,\nSeek those things which are above;\nLooking toward the perfect mark,\n'Tis the prize of the people of the Lord."
  },
  "244": {
    "title": "How Great Are the Wonders of My God",
    "lyrics": "How great they are,\nThe wonders of my God!\nHow great they are,\nHe transformed this heart of mine.\nI used to think\nThat I had no pardon left,\nYet the Lord,\nIn His goodness saved my soul.\n\nCHORUS: Great they are,\nLife eternal He bestowed;\nThrough His love,\nWhich the Father gave to me,\nThrough His love,\nShown upon the shameful cross,\nGreat they are,\nHis salvation He bestowed.\n\nOnce did I weep,\nIn bitter grief and pain;\nAll of my tears\nHeld no value of their own,\nFor I was then\nAn unworthy sinner lost;\nKnowing Him not,\nWho His love on me bestowed.\n\nNaught have I, Lord,\nTo offer to my King;\nHaving naught else,\nI will yield my heart to Him;\nAnd in it work\nWhatsoe'er His purpose wills;\nThis only I know,\nThat He sought and found my soul."
  },
  "245": {
    "title": "My Jesus Christ",
    "lyrics": "O my Jesus Christ,\nWho didst die upon the cruel cross;\nThrough that blessed sacrifice of Thine,\nThou hast given me full light.\n\nCHORUS: I live no more,\nChrist is He that lives in me;\nAnd that which now I live, in Christ,\nI live in holy joy.\n\nAll of Thy children,\nFather Eternal and King of peace;\nWe render praise unto Thee, awaiting\nThy coming to bear us home.\n\nPilgrims are we,\nMidst our trials and tempting snares;\nMay Thy holy grace preserve our souls,\nBlessed Redeemer.\n\nWith holy joy,\nWe exalt Thy wondrous favor, Lord;\nThou didst deliver our souls from death,\nAnd blessing didst bestow."
  },
  "246": {
    "title": "If Any Man Thirst, Let Him Come...",
    "lyrics": "If any man thirst,\nLet him come and drink;\nOf the water of life\nWhich Christ freely offers,\nTo thee today within thy heart.\n\nCHORUS: Come to Jesus,\nCome, He calls to thee in love;\nHe desires to grant thee life,\nAnd rest within His home above.\n\nIf thou art feeling hungry,\nAnd thy soul doth thirst within,\nCome today to Jesus Christ;\nWith Him forevermore\nThou shalt never thirst again.\n\nIf thou art worn and weary,\nAnd bowed down beneath thy grief,\nForget not that Jesus\nDoth say to us: \"Come,\nAnd I will give you rest.\"\n\nIf thou art sick and feeble,\nAnd no health is found in thee,\nLo, Christ heals and cleanses\nBoth body and soul,\nAnd He will make thee live."
  },
  "247": {
    "title": "I Follow Jesus",
    "lyrics": "I follow after Jesus,\nA faithful Friend is He,\nFor He hath promised to help my soul;\nIn every single struggle\nThat ever I endure,\nHe cometh to take them away.\n\nCHORUS: It is my hope\nTo reach into heaven,\nWith Christ to rejoice and forever reign;\nI will not falter,\nWhate'er be my trials,\nFor Christ will succor me.\n\nI follow after Jesus,\nThe Way of truth is He,\nThe pathway of joy and eternal life;\nIf I remain steadfast\nUpon the righteous way,\nWith Christ I shall rejoice.\n\nStill onward am I walking,\nThrough sorrow and through joy,\nFor Jesus my Savior I soon shall see;\nThere in His high kingdom\nOf joy unspeakable,\nThere shall I joy as well."
  },
  "248": {
    "title": "My Soul Wandered Without God",
    "lyrics": "My soul wandered far\nWithout God in the world,\nIn shadow of darkness\nLost in my sin;\nYet now with the saints,\nWalking in the light,\nTo heaven I go with Christ.\n\nCHORUS: Savior of the universe,\nWho from heaven did descend;\nUnto all the world to give life,\nUnto death He gave Himself.\n\nThe grace all-divine\nOf the God of the heavens;\nThrough Christ unto me\nHath freely been granted;\nMy sins, though so great,\nHave all been blotted out,\nIn Christ I have life today.\n\nMy soul was once lost,\nIn death was it lying,\nThrough Jesus the Christ\nIt hath been raised up;\nThrough Christ I give praise\nTo the God of the heavens,\nFor all hath He pardoned me.\n\nForever be praised,\nO Lord, Thy holy Name;\nO Lord God most blessed\nAnd Omnipotent King,\nThrough ages eternal,\nBe Thou ever glorified,\nFrom this time and forevermore."
  },
  "249": {
    "title": "A Servant of God Told Me",
    "lyrics": "A servant of God told to me\nThe wondrous marvels of God;\nHow He gave us a Savior,\nFor our eternal salvation.\n\nCHORUS: One day my Lord shall return,\nWith His angels He shall come;\nFor Him I will wait\nIn the spiritual Church,\nWhich is the Church of God\nThe Living... Thou art\nThe pillar and ground of the Truth.\n\nI sought in the world after truth,\nYet only vanity found;\nAnd all manner of wickedness,\nAnd pleasures of evil and sin.\n\nAt last I discovered sweet peace,\nWith Jesus my Redeemer;\nI rejoice to give ear unto\nThe faithful Word of His love."
  },
  "250": {
    "title": "A Path on Bended Knees I Found",
    "lyrics": "A path on bended knee I found,\nIn the world my poor life did roam;\nAnd weary upon the stray paths of deceit,\nThe Shepherd Divine sought my soul.\n\nCHORUS: Vain illusion beguiled my soul,\nMystic path that my spirit found;\nIn the treacherous world with its alluring charms,\nAnd its enchantments ruined my soul,\nLike a lion it tore me apart.\nMy heart found a sepulchre cold,\nMy spirit was lost in the depths of ruin,\nOf the sin that brought death to me.\n\nSalvation the Savior bestowed on me,\nOn His shoulders He granted me rest;\nAnd weary upon the stray paths of deceit,\nThe Shepherd Divine found my soul.\n\nOne day shall this world its reward receive,\nIts allurements shall soon pass away;\nIts vain fascinations and vanity,\nBy Christ shall be brought to nought."
  },
  "251": {
    "title": "New Horizons Brightly Shine",
    "lyrics": "New horizons brightly shine,\nAll the tempest now is past;\nAll the anguish has fled away,\nAnd sweet peace has come at last.\n\nCHORUS: Peace divine, that wast once so far,\nAnd without thee a wanderer I lived;\nYet the gentle voice of the Savior spoke\nAnd brought consolation into my soul,\nAnd a life of true joy;\nNow I live in Thee, my Jesus good.\n\nNow I joy in a life made new,\nThrough Jesus my Savior and King;\nHe imparted His grace to me,\nAnd His love hath redeemed my soul.\n\nWe shall go to rejoice with Christ,\nIn the great New Jerusalem;\nNow, my brother, I summon thee:\nLet us faithful to Him remain.\n\nPalms and crowns hath He laid in store,\nRighteous prizes which He shall bestow;\nMay they adorn thy brow,\nHenceforth and forevermore."
  },
  "252": {
    "title": "Mary Magdalene Surrenders to Jesus",
    "lyrics": "Mary Magdalene yieldeth to Jesus,\nA sinful woman who seeketh the light,\nAnointing with oil Christ the blessed Lord,\nBowed down on her knees with the kisses of love;\nThe multitude marveleth, struck with dismay,\nBeholding Mary with Christ the Lord.\n\nCHORUS: The publicans shall go in before,\nAnd the harlots, to the kingdom of God;\nIf they repent, He forgiveth them,\nTheir many trespasses and all their sins.\n\nJesus beholdeth all those round about,\nGranting free entrance to sinners in need:\n\"O sinful daughter of Jerusalem;\nI give unto them life, and crown them with good;\nThy many sins are forgiven thee;\nGo tell to the people that God is Love.\"\n\nJesus searcheth deep in their hearts;\nThe doubts of the many and prideful deceit:\n\"I entered thy house, and thou gav'st Me no kiss;\nThou hast not anointed My head with rich oil;\nThou gav'st Me no water to wash My feet;\nThe deed that thou seest is hallowed to Me.\""
  },
  "253": {
    "title": "O What Joy My Soul Doth Feel!",
    "lyrics": "O what happiness my soul doth feel!\nFor now my faith is grounded\nIn the Word,\nNeither wind nor stormy blast\nCan tear it away;\nFor the love of Jesus Christ\nAbideth in my soul.\n\nCHORUS: Love, holy love,\nHealed all the sorrow\nOf my soul that in the world\nSuffered so much;\nYet today if I should suffer\nFor that Holy One;\nI shall have Eternal Life\nIf I am meek.\n\nThe messenger here is like living water,\nSatisfying the droughts\nWith the Word;\nTelling them of Jesus Christ,\nThat He saves them,\nBringing unto them sweet rest\nFor their soul.\n\nHouseholds that were found\nWithout any peace,\nGroaning in this life so bitter and hard;\nThough they endeavored\nTo depart from it,\nYet the devourer held fast their souls.\n\nToday Christ in power hath ascended on high,\nLeaving the enemy wholly undone;\nSaying with love: \"Come ye unto Me,\nFor I am the Truth, the Life, and the Way.\""
  },
  "254": {
    "title": "Thy Goodness Endureth Forever",
    "lyrics": "Thy goodness is forever, O Eternal King!\nThy love divine that hath filled all my heart;\nThy Truth is forever, O God of heaven!\nWhich endureth unto all eternity.\n\nCHORUS: With Thy blood Thou hast cleansed Thine own people,\nAnd gavest them holiness for a sign;\nThou hast sealed them with the Holy Spirit,\nAnd granted redemption in Thy great grace.\n\nThou art comfort to the souls that seek Thee,\nTo rejoice with the great Comforter,\nWho leadeth us into truth and righteousness;\nIt is the word, the Gospel of love.\n\nA blessed hope do I hold within my soul,\nTo dwell forever with the Father above;\nTo rejoice with all the saints redeemed,\nTo inherit an unfading crown of life."
  },
  "255": {
    "title": "Our Crown",
    "lyrics": "Our crown we must fashion and work to attain\nBy our good works here upon the earth;\nOur diadem we must adorn and deck\nWith precious jewels which our God doth give.\nOur garments we must prepare and array,\nFor snow-white purity God will bestow;\nWork out your crown with all your love,\nWhich Christ upon our brow\nShall place.\n\nCHORUS: Jewels that shall endure with Christ\nIn the eternal kingdom,\nThere shall we find them all.\n\nLay up your treasure in the heavenly realm,\nAnd great riches with Christ\nYonder; on this earth we must labor on,\nFor God at last will the reward bestow;\nA treasure vast that shall never decay,\nWealth that up there shall never end;\nAnd it shall be a wondrous treasure and store\nWhich Christ shall place into our hand.\n\nThere is no wealth like the kingdom of God,\nNor recompense like that which God doth grant,\nNor greater crown than that which the Lord\nShall unto each for his works bestow;\nIf we have wrought it, prepared it shall be,\nThere with Jesus Christ it shall be found,\nAnd placed on all by Christ the King,\nForever and ever it shall abide."
  },
  "256": {
    "title": "Prayer That Sustains My Soul",
    "lyrics": "Prayer that sustaineth my weary soul,\nThy power upholdeth me unto this day;\nThy virtue doth bring me a peace so sweet,\nAs onward I walk following the Lord.\n\nCHORUS: Teach us to pray, the Apostles said\nUnto their Master and Lord;\nTeach us to pray, we ask today as well,\nFor we desire to rejoice and sing in the New\nJerusalem.\n\nPrayer that impartest sweet comfort to me,\nWhen with temptation I strive in the fight;\nA guide art thou leading up to the skies,\nTo joy evermore with the Savior Good.\n\nPrayer that ordained was by Jesus the Christ,\nWe know and we cherish thy holy power;\nWe will hold fast to thee continually,\nTill the Shepherd of Israel we behold."
  },
  "257": {
    "title": "I Am a Soldier",
    "lyrics": "I am a soldier of Israel,\nAnd I will fight with my King;\nOn the right hand and on the left I will fight,\nTrusting in Christ I shall overcome,\nFor in Christ there is power.\n\nCHORUS: There is power, power, matchless power\nIn my heavenly Father;\nI can do all things,\nHe is my Helper, for the LORD\nIs my God.\n\nI am a soldier of Israel, and my duty is to fight\nAgainst every sin and wickedness,\nTrusting in Christ I shall overcome,\nFor in Christ there is power.\n\nI am a soldier of Israel, my Helper is Jesus;\nHe teacheth me how I ought to fight;\nBlessed be His name throughout eternity,\nFor in Christ there is power.\n\nWeapons of mighty power my good Lord\ndoth give unto me,\nThat I may always overthrow and destroy\nThe fierce adversary and all of his host;\nFor in Christ there is power."
  },
  "258": {
    "title": "Jesus Gave Me Life",
    "lyrics": "Jesus gave life unto me,\nHow good He is, how good He is!\nTo thee also can He give it,\nIf in His Word thou believest.\n\nCHORUS: Under Thy blood, O Jesus!\nUnder the blood of Thy cross;\nEver beneath that flowing stream,\nKeep me, O Jesus good.\n\nThe light of Christ in my soul hath shone,\nHow good He is, how good He is!\nInto thy soul it shall shine as well\nIf thou wilt come to His feet.\n\nTo heal the sick and afflicted He came,\nHow good He is, how good He is!\nSick was I, and He healed my soul,\nGive glory unto Him."
  },
  "259": {
    "title": "Jesus, My Redeemer",
    "lyrics": "Jesus, my Redeemer,\nHealeth me with His love;\nFrom every disease,\nAnd taketh away my pain.\n\nCHORUS: In my distress, I cried to the Lord:\nIf Thou wilt, Thou canst heal me;\nAnd only by His Word\nWhich He spoke, made whole was I.\n\nSick and afflicted was I,\nAnd Christ healed my infirmity;\nHe heard my humble prayer,\nHis promise He fulfilled.\n\nThe servants of the Lord\nPrayed with fervent desire;\nHealing He granted me,\nJesus, my Redeemer.\n\nThe ailments of my flesh,\nThe Lord took far away;\nThrough the prayer of faith\nOf His congregation.\n\nThe blood of Jesus Christ\nHath power unto this day;\nMe hath it washed and cleansed,\nBy faith I am now saved."
  },
  "260": {
    "title": "Lord, Hear My Prayer",
    "lyrics": "Lord, hear my prayer,\nAnd my petition and supplications;\nLord, have mercy on me,\nAnd in Thy goodness, grant me comfort.\n\nCHORUS: Lord, unto Thee I pour out my soul,\nFor Thy grace saveth me;\nLet my prayer enter into Thy presence,\nWhere Thou art seated, Lamb of God.\n\nLord, be Thou my guide,\nAnd my defense in all my conflicts;\nThou art my helper true,\nAnd in my deep distress, Thou strengthenest me.\n\nJoyful my soul one day shall be,\nRest it shall have in heaven;\nThere I'll rejoice in Thy love,\nAnd give Thee praise, O Holy Lamb."
  },
  "261": {
    "title": "Sweet Moments of Prayer",
    "lyrics": "Sweet moments of prayer,\nWhich at the altar I do spend;\nWhen contrite as I make my plea,\nI feel communion with my God.\n\nCHORUS: Brother, come, come to the altar,\nBring to the Lord thy contrite heart;\nCome with us for to partake,\nOf the great supreme blessing.\n\nIf weeping overwhelm my prayer,\nTroubling and cutting short my plea,\nThough crying and without a word,\nMy God doth know the heart.\n\nGod doth not despise the sinner,\nRather He longeth to forgive;\nWhen humbled to the Lord he goes,\nHe granteth grace and holiness."
  },
  "262": {
    "title": "I Was Lost",
    "lyrics": "I was lost in guilt and sin,\nYet did the Lord deliver me;\nFor me His precious blood He shed,\nPoured out upon the cursed tree.\n\nCHORUS: /:/Unto Jesus Christ I owe my life,\nFor He hath given it to me\nWhen it was lost/:/\n\nOut of the misery of sin,\nFrom thence the Lord delivered me,\nWherein I lived a bounden slave,\nYet did the Lord redeem my soul.\n\nI was a captive slave of sin,\nMy soul in bondage did abide;\nYet Jesus Christ hath set me free,\nThrough Him I walk in liberty."
  },
  "263": {
    "title": "Christ Saith to Me: \"Cleanse Thyself More\"",
    "lyrics": "Christ saith to me: Cleanse thyself more,\nLove not the world nor evil deeds;\nIf this He saith to me: What shall I do?\nI must strive forward more and more.\n\nCHORUS: This is the voice of our great God,\nWho promiseth salvation sure;\nLet us be holy as He saith,\nLet us obey the Lord our King.\nHe longeth to behold our love,\nPraying with fervor evermore;\nLet us be clean and perfected,\nFor He hath thus established it.\n\nLet us be holy like our Lord,\nFor soon the marriage feast shall come;\nIf now thy garments do not shine,\nInto the banquet thou shalt not go.\n\nA living sacrifice I'll be,\nFor Christ my King demandeth it;\nBlameless and pure in lowliness,\nGiving Him glory evermore. Amen."
  },
  "264": {
    "title": "Blessed Be the Saints of God",
    "lyrics": "Blessed be the holy saints of God\nWho in this House of Prayer abide;\nWho in one body bless the Great Creator,\nBlessed are they that come in peace,\nIn the holy Name of the Lord.\n\nCHORUS: Blessed be of the Creator,\nThey that lift up the banner high;\nBanner of love, the standard of love,\nBlessed for their great labor done.\n\nBlessed are the chosen of God,\nWhom the Lamb of God hath saved,\nAnd with His Spirit He hath sealed them.\nBlessed are they that come in faith,\nIn the holy name of the Lord.\n\nWe shall forever praise the Lord,\nAnd we shall sing with fervent voice,\nGiving all glory and honor unto our God;\nBecause He giveth us the victory,\nHallelujah, Glory to God!\n\nBlessed be the Lord Jehovah our God,\nWho granteth us to be in fellowship;\nIn this Church of Christ the Good Shepherd,\nBlessed be the great King of kings,\nFor His most abundant blessing."
  },
  "265": {
    "title": "Oh, How Pleasant It Is to Dwell Here",
    "lyrics": "Oh! how pleasant\nIt is to dwell here,\nAll in sweet communion,\nFor here Jesus commandeth life\nAnd His blessing from above;\nWe are all one Body here,\nUnited in the Lord, awaiting\nThat He come to catch us up.\n\nCHORUS: By this shall all the nations\nKnow this day\nThat we are sons of God,\nIf we love one another from the heart\nAnd if we are faithful to Him;\nIn the clouds He shall appear\nAnd catch us away; a thousand years\nWe shall reign with Jesus Christ.\n\nMay Christ abide here through our faith,\nIn Spirit and in holy Truth;\nRevealing and instructing us\nIn all that is the Truth,\nUntil we all attain at last\nUnto a full perfection,\nThat when He cometh in His power,\nHe may take us to His home.\n\nOne alone is our God and Lord,\nWhose name is beyond compare;\nIt is Jesus Christ who was,\nWho is now, and is to come;\nTherefore we render Him the praise,\nWhich the Savior doth deserve;\nEven as one man,\nPraising the God of love."
  },
  "266": {
    "title": "We Have Come to Seek",
    "lyrics": "We have come for to seek,\nA rich blessing from above;\nWe have come to rejoice,\nIn this Congregation here.\n\nCHORUS: Glory let us sing\nUnto the Savior;\nGive ye all praises\nUnto the Redeemer.\n\nWe have come unto this Church,\nThe Pillar of the Truth;\nWe have come to rejoice,\nIn the love of Jehovah.\n\nIf there be a soul that longeth,\nTo give to Christ his heart;\nToday is the accepted time,\nForgiveness to receive.\n\nHis holy Word instructeth us,\nThat we should love each other;\nThis is the most precious key,\nForgiveness to obtain.\n\nWithin the Word of God we find\nTrue life and full salvation,\nIf we will consecrate our lives\nBy earnest, fervent prayer.\n\nGreat joy we have in this blest hour,\nIn this our Congregation;\nYet greater joy shall surely be,\nThat souls come to the Lord."
  },
  "267": {
    "title": "We Are One Body in Christ...",
    "lyrics": "We are one body in Jesus Christ,\nWith gifts of diverse measure;\nBoth Deacons and the Ministers,\nAnd all the Congregation.\nAnd if we walk in sweet accord,\nOur charity shall grow;\nAlone we are no longer left,\nFor God shall be our help.\n\nCHORUS: All in one Beloved,\nAll in sweet communion;\nEvermore rejoicing,\nIn this great salvation.\n\nWithin this Body all are found,\nTogether in communion;\nThere is the gift of healing power,\nAnd of exhorting too.\nThere is the gift of prophecy,\nAnd that of sound doctrine;\nAll are distributed abroad,\nAccording to His will.\n\nAll forming but a single Body,\nIn preaching of the Word;\nYet joined together, everyone,\nWith diverse work to do;\nThe one instructeth other brethren,\nA witness for to bear;\nThat one may help another soul,\nThe gospel to proclaim.\n\nThis whole assembly joined in Christ,\nHath heavenly nourishment;\nFor He is the true Bread of life,\nUnto His Congregation;\nThe Water of pure life He hath,\nTo quench the burning thirst,\nOf every sinner who doth come,\nSeeking for His salvation.\n\nChrist is our everlasting Head,\nHe is our Shepherd good;\nHe gave to us the Promise sure,\nOf the blest Comforter.\nOur souls are filled unto the brim,\nWith His unbounded love;\nUnited let us render praise,\nTo Christ our Savior King.\n\nWe are one body and no more,\nIn Jesus Christ our Lord:\nNow dead unto this fleeting world,\nAlive unto the Lord.\nWe shall be lifted up on high,\nIn resurrection power;\nTriumphant we shall enter in,\nThe city of Mount Zion."
  },
  "268": {
    "title": "Unite Your Songs, All Ye Saints",
    "lyrics": "Unite your voices,\nAll ye blest saints,\nIn tender love;\nWith holy awe,\nFor in the presence\nOf God ye stand\n\nCHORUS: Welcome be ye, beloved brethren,\nIn the Name of Christ Jesus our Lord;\nGathered today we rejoice in our souls,\nKnowing we are united in love;\nWe give thanks for salvation bestowed,\nAnd our soul feeleth deep gratitude;\n/:/For Lord Jesus alone giveth life and true health,\nAnd the Glory to him bearing His cross/:/\n\nEvery true Christian\nLoveth his brother\nFrom a pure heart;\nHe seeth no borders,\nThrough the earth walking,\nSowing His love.\n\nVery soon gathered,\nAll the elect ones\nShall go to God:\nAnd up in heaven\nReceive their reward,\nFor all their toil."
  },
  "269": {
    "title": "My Cup Here Runneth Over",
    "lyrics": "My cup here runneth over,\nIn this blest gathering,\nTo see my faithful brethren,\nJoined in Communion sweet;\nRejoicing and so joyful,\nIn Jesus Christ my Lord.\n\nCHORUS: Glory we will give from the heart,\nFor gathering here in the church;\nPraises we render to Jesus our Lord,\nAnd in communion forever,\nWalking in His pure light.\n\nBoth Elders and the Pastors,\nAnd all the Congregation;\nAll as one single body,\nServing the Savior Lord;\nBe valiant and press onward,\nTo fight against the dragon.\n\nHere prostrate, meek and lowly,\nServing my Savior King:\nHis heavenly, living fountain\nFlows down into my heart;\nHis holy Word of promise\nLeads to His Mansion fair.\n\nGo forth and fight the battle,\nO saints of Christ the Lord!\nRejoicing, giving glory\nTo Him who died on the cross;\nThe God of all believers,\nProclaiming His bright light."
  },
  "270": {
    "title": "The Blessing of the Lord",
    "lyrics": "The blessing of Jehovah God\nBe with all you who truly love\nOur Father high in heaven above;\nBlessed are ye,\nHaving received the Savior blest.\n\nCHORUS: O Lord Jehovah,\nJehovah of the Hosts of heaven;\nThy People stand,\nUnited in the living truth,\nTo give all glory and high praise,\nUnto Jesus the Christ,\nThe great Redeemer King.\n\nThe blessing of the Lord Jesus,\nWith joy we do possess this day,\nWho in His holy pathway walk;\nTrue Light of truth,\nGospel of the kingdom, Light peerless and bright.\n\nThe blessing of the Lord on high,\nAbide upon your waiting souls,\nO blessed, chosen of the Lord!\nYe royal household who enjoy\nLiberty granted from above."
  },
  "271": {
    "title": "Blessing, Communion Is the Divine Song",
    "lyrics": "Blessing, communion blest,\nIs the celestial song;\nOf those redeemed by grace,\nThrough the Lamb who in Zion dwells.\n\nCHORUS: My cup runneth over,\nAs I behold my brethren,\nMy joy is fulfilled,\n with those who are washed and cleansed;\nOh, what joy! And what sweet contentment\nI feel in the Church of the Lord.\n\nPrayer and communion blest,\nIs the joy of the upright;\nThe sweet song of the saints,\nWho full redemption have attained.\n\nSalvation, fellowship,\nIn the Church of the Lord;\nThe Holy Spirit hath\nPoured forth His sweet and tender love.\n\nRedemption, fellowship,\nAnd life eternal at the last,\nWithin the mansion blest,\nSinging to Christ our praise and laud."
  },
  "272": {
    "title": "Blessed Be Jesus Christ for His Love",
    "lyrics": "Blessed be Jesus Christ for His love,\nHis precious blood He shed in great grief;\nThe world He overcame in His might,\nDestroying all the power of the foe.\n\nCHORUS: Sing, O ye people of the Lord,\nSing unto Christ, your sovereign King;\nWe bless His name in holy liberty,\nIn all His grief He bore away our shame;\nUnto Him be holiness,\nUnto Him be holiness, holiness.\n\nBlessed be our Advocate, Emmanuel,\nHis holy death hath poured salvation down;\nHis people now sing praise and endless laud,\nFor in His Name alone redemption stands.\n\nBlessed be the Lamb of heaven above,\nWho by His holy baptism cleansed my soul;\nAnd by His holy promise I am led,\nEach passing day I'll conquer every sin.\n\nBlessed be Jesus Christ of Nazareth,\nFrom this wicked world He lifted me;\nI surrender now my whole being to Him,\nAnd there with Him at last I shall reign."
  },
  "273": {
    "title": "Let Us Give Thanks unto the Lord",
    "lyrics": "Let us give thanks unto the Lord,\nHe hath defeated all the foe;\nOur victory was won through Him,\nAll should accord Him honor due.\n\nChorus: In the world we wander,\nLet us tell the story;\nHow the Lord Christ Jesus\nCame on earth to die.\nLet not any faint now,\nFor we soon shall enter\nThe eternal homeland,\nWhich He went to make.\n\nHe hath contended against sin,\nLife He hath granted unto us;\nBy His own power He triumphed,\nAll should accord Him honor due.\n\nGreat is the God of my salvation,\nLet heaven and earth sing unto Him\nThe glory of His mighty power;\nAll should accord Him honor due.\n\nNow lost already was our faith,\nAnd every hope of being saved;\nYet did my God reveal His love,\nAll should accord Him honor due."
  },
  "274": {
    "title": "Now Good Jesus to Heaven Hath Ascended",
    "lyrics": "Now good Jesus,\nTo heaven hath ascended;\nGlory, hallelujah, Christ saveth!\nI trusted in Him and He welcomed me,\nGlory, hallelujah, Christ saveth!\n\nChorus: He saveth, He saveth,\nGlory, hallelujah, Christ saveth ::\n\nThis is the way that with cause I sought,\nGlory, hallelujah, Christ saveth!\nOh, how I suffered while knowing it not!\nGlory, hallelujah, Christ saveth!\n\nMy good Savior will forgive my sins,\nGlory, hallelujah, Christ saveth!\nAnd just as I am, He will welcome me,\nGlory, hallelujah, Christ saveth!\n\nThen unto every sinner I will say:\nGlory, hallelujah, Christ saveth!\nHow I did find my blest Savior,\nGlory, hallelujah, Christ saveth!"
  },
  "275": {
    "title": "The Name of God Is a Name Without Equal",
    "lyrics": "The name of God is a peerless name,\nWho can restore thee, who can save thee,\nAnd bring thee from Egypt, this evil world;\nThe name of God is a peerless Name.\n\nChorus: Come, come, listen, O sinner,\nCome today to the Savior good;\nIn Him thou shalt find consolation,\nIn Him thou findest peace,\nAnd for thy soul, sweet pardon.\n\nPower and virtue is the Name of God,\nAnd there is no other name under heaven,\nWherein thou mayest find comfort and pardon,\nSave only in the Name of Jesus Christ.\n\nJehovah our God, Jehovah is one,\nWho to the sorrowful, lost, and weary of soul,\nGiveth sweet peace and calm in his heart;\nJehovah our God, Jehovah is one."
  },
  "276": {
    "title": "In the Service of the Lord",
    "lyrics": "In the service of the Lord,\nSolace sweet is found;\nIn the service of the Lord,\nPeace doth ever abound.\n\nChorus: Oh, sweet peace, sweet peace!\nWhich the Lord hath placed in my soul;\nOh, sweet peace, sweet peace!\nI cannot comprehend;\nOh, what wondrous peace!\nGod hath placed in my soul,\nHallelujah to Him for His goodness.\n\nIn the pathway of the Lord,\nTruth I do behold;\nIn the pathway of the Lord,\nJoy untold is found.\n\nIn the doctrine of the Lord,\nI confirm my faith;\nIn the teaching of my Lord,\nPardon I have found.\n\nIn the service of the Lord,\nI will sing with love;\nIn the service of the Lord,\nI will praise the Lord."
  },
  "277": {
    "title": "I Am Happy in the Service of the Lord",
    "lyrics": "I am happy in the service of the Lord,\nVery joyful, oh, so glad;\nI have peace, contentment, and sweet love,\nServing Jesus, Savior blest.\n\nCHORUS: Serving Christ the Savior blest,\nServing Him with tender love;\nOh, how joyful do I feel,\nServing Christ the Savior blest.\n\nI am happy in the service of the Lord,\nVery joyful, oh, so glad;\nNow I dedicate my talents\nTo the Lord, I will serve the Savior blest.\n\nI am happy in the service of the Lord,\nVery joyful, oh, so glad;\nIn the conflict courage never shall depart,\nWhich my Savior giveth me.\n\nI am happy in the service of the Lord,\nVery joyful, oh, so glad\nThrough the night the Shepherd good abides with me\nI will serve the Savior blest."
  },
  "278": {
    "title": "Christ Is Our Vine",
    "lyrics": "Christ is our True Vine,\nGod the Husbandman;\nHe within us works\nFruits of holy love;\nHe who abides in Him\nBearing fruit shall stand;\nHe who perseveres\nWith the Lord shall reign.\n\nCHORUS: It is my joy… it is my joy,\nTo abide with you,\nIf ye hold fast… if ye hold fast\nMy love to the end;\nThis is my Commandment:\nThat ye love each other,\nAnd be ye my friends,\nSaith the Lord our God.\n\nChrist hath promised us\nTo be to the end,\nWith His holy Church\nFor to redeem;\nThose who wander far\nFrom the holy fold;\nIn the Holy Bible\nThus He saith to us.\n\nIf the Christian suffer\nAs a child of God,\nNever turning backward,\nWalking in His steps;\nIn his tribulations\nCalling upon Jesus,\nKnowing following Him\nIs to bear his cross"
  },
  "279": {
    "title": "How Sweet Is the Name of Jesus",
    "lyrics": "How sweet the Name of Jesus sounds\nUnto the faithful soul;\n/:/Comfort and peace, vigor and health,\nI ever find in Him/:/\n\nIt giveth strength unto the wounded breast,\nAnd calms the troubled heart;\n/:/'Tis to the hungry soul like\nManna, that relieves my grief/:/\n\nSo sweet that Name is unto me,\nOf gifts the fullness true;\n/:/A fount I never saw run dry,\nOf saving grace and health/:/\n\nJesus, my friend and my support,\nThou blessed Savior mine;\n/:/My life, my light, my endless good,\nAccept my song of praise/:/\n\nThough poor and weak my song is now,\nWhen I am with Thee there;\n/:/And I behold Thee face to face,\nI'll praise Thee better still/:/"
  },
  "280": {
    "title": "My Glory Is to Praise Thee",
    "lyrics": "My glory is to praise Thee,\nO God omnipotent!\nMy joy is to exalt Thee\nWith all my heart within;\nIn the congregation\nOf Thy faithful saints\nI pour out my soul,\nProlonging my fervent prayer.\n\nCHORUS: My joy is to adore Thee,\nO Jesus, Savior good!\nGrant me, O Lord, Thine aid,\nFor to bear Thy cross.\n\nA Being unseen and holy,\nHath granted me salvation;\nMy joy is for to bless Him,\nAnd ask His guidance true;\nOnly by faith alone hath He saved me,\nI find myself rejoicing,\nBecause I live for God.\n\nThe pathways of transgression,\nMy heart hath cast away;\nMy struggles are increased,\nYet power is in God;\nGreat is the God\nIn whom I have trusted,\nA King of power,\nAnd He made me conqueror.\n\nDirect Thou all my footsteps,\nThat in Thy way they walk,\nAs onward I do pilgrim\nUntil at last I reach,\nTo rejoice there in Thy presence\nAnd in full gladness,\nThine holy Name exalt."
  },
  "281": {
    "title": "Fear Not, Brother, If Thou Sufferest",
    "lyrics": "Fear not… brother, if thou sufferest\nFor the cause of the Lord;\nFrom heaven… Christ is heard saying;\n“I am with thee”.\n\nCHORUS: Faithful is He that promised,\nChrist our Saviour;\nBe thou faithful unto death, He saith,\nAnd I will give unto thee,\nThe celestial crown;\nSaint Paul assureth us\nThat we shall inherit it.\n\nBrother… trust in Christ,\nThat thou mayest overcome;\nHelp… and a shield shalt thou have\nIn Christ, if thou be faithful to Him.\n\nBrother, forsake thou never,\nThe good way of the Lord;\nIf thou longest… for life,\nCast away now all murmuring.\n\nLet us follow… brethren, after Christ,\nAs our faithful Shepherd,\nLet us not be… unfaithful,\nAs Judas was unto his Saviour\n\nBrethren… let us strive,\nTo attain the prize of the Lord;\nLet us run… with confidence\nThe faithful race of salvation."
  },
  "282": {
    "title": "I Long to Feel Blessing, O Sweet God",
    "lyrics": "I long to feel Thy blessing,\nO sweet God!\nIn the gathering of Thy faithful believers,\nI would rejoice, I would sing,\nWith grace in my heart\n\nCHORUS: Lord of peace,\nWash me more and more\nThat I may enter in\nUnto Thy spiritual banquet\n\nMy heart, Holy God,\nWaiteth today,\nFor the communion of Thy Holy Spirit,\nMake me to feel Thy blessing,\nPut gladness in my heart.\n\nAll sorrow, Lord,\nTake Thou from me,\nI would feel joyful at Thy side,\nMy heart desireth to feel,\nThe spiritual food.\n\nA hope, Lord,\nIs in my being,\nTo receive the crown of Life,\nI will walk now by faith,\nUnto Thy spiritual mansion."
  },
  "283": {
    "title": "This Is the Joy of the Christian",
    "lyrics": "This is the joy of the Christian:\nEver to praise his Creator,\nTo follow peace with his brethren,\nAnd to be constant in prayer\nTo bear the tidings of His grace\nUnto the lost, who without God\nWander without light, without hope,\nYet find forgiveness in Christ\n\nCHORUS: For from death he passeth unto life\nFrom darkness into light\nAnd beareth in his redeemed soul\nThe sweet name of Jesus\n\nHe bringeth from his soul the infinite\nSeeking holy communion\nAnd his delight is in Christ alone\nFor he feeleth Him within.\nAs a witness of this cause,\nAnd gratitude is in his breast,\nFilled with love and confidence,\nHe presseth forward with his cross.\n\nIn his sorrow he hath joy,\nIn his sadness, blessing\nFor he seeth near at hand that day,\nWhen his affliction shall end\nTherefore joyful at every hour\nWith all his soul he singeth now\nThat with Jesus he shall go to glory\nThroughout a long eternity."
  },
  "284": {
    "title": "At the Break of Dawn",
    "lyrics": "At the break of dawn I present myself to Thee\nAsking sweet calm, which cometh from Thee,\nEre the dawn breaketh, here will I be;\nEre the sun riseth, to Thee will I come.\n\nCHORUS: In the morning Thou shalt hear my voice\nIn the morning will I present myself and wait,\nAt the break of dawn I will come in prayer,\nAsking for my soul Thy blessing.\n\nThou lovest him that loveth with all his love,\nAnd rising early, he findeth Thee who seeketh Thy love,\nIf he seeketh Thy face, Thou wilt reveal Thyself,\nO God Almighty, at the dawning of day.\n\nWhosoever watcheth and is in prayer\nIs like unto the watchman fulfilling his post,\nToday my soul waiteth for Thee, my good Saviour,\nMore than the watchmen do I wait for Thee."
  },
  "285": {
    "title": "I Know That Christ Is My Shepherd",
    "lyrics": "I know that Christ is my Shepherd,\nNo power shall there be\nThat can sever me from Him;\nHe leadeth me with love,\nBeneath His shelter secure am I.\n\nCHORUS: His great love shall never fail me\nSo much He loved me, better than I know;\nAnd when in His presence I shall be\nBliss without end with Him I'll have.\n\nI feel Him very near to me,\nWhen tempted I am like to yield;\nHis love is everything to me,\nAnd gladly I sing where'er I go\n\nI fear not, for I trust in Him,\nNor what tomorrow shall bring forth;\nAll of my cares I tell to Him,\nFor my Jesus will comfort me.\n\nJesus gives strength unto my soul,\nWhen I am lonely and without support;\nHis love delivereth me from falling,\nAnd to the end, He will keep me."
  },
  "286": {
    "title": "Let Us Follow the Footsteps of Christ Jesus",
    "lyrics": "Let us follow the footsteps\nOf Christ Jesus,\nHe is our refuge,\nOur guide and our light\nLet us remember that Christ\nIs the faithful Friend.\nWith joy let us sing\nPraises unto Him.\n\nCHORUS: Now I am journeying\nToward that fair home\nWhich Christ the Master\nWent to prepare for us;\nOfttimes He saith to me\nTarry thou no more\nIf faithful thou persevere\nMy glory shalt thou see.\n\nI give glory to Thy Name,\nDivine Lord,\nThough I was unworthy\nAnd a vile sinner,\nThou didst receive me\nWith all Thy love\nNow with rejoicing\nI give Thee praise.\n\nIf strength should fail thee,\nAnd thou canst not attain,\nTake refuge in Christ\nHe will give thee rest\nThere is joy in heaven\nOver one sinner\nWho cometh to His feet\nAnd seeketh His love.\n\nI praise Thy name\nDivine Lord,\nI will tell unto men;\nThat Thou art love,\nThat for our trespasses\nThou diedst upon the cross,\nThat all of us must\nFollow Thee, Jesus."
  },
  "287": {
    "title": "We Are Journeying Toward That Land",
    "lyrics": "We are journeying on\nToward that fair land,\nWhich our Master\nWent to prepare for us;\nWhere we shall enter into rest\nForever, amen.\n\nCHORUS: There is a country, well I know,\nWhere streets of purest gold abide,\nIt is a home where I shall dwell\nThroughout all eternity.\nIt is the mansion where I shall dwell\nThroughout all eternity.\n\nWe are journeying on,\nWe are pilgrims here\nIn this world below\nWe must not rest;\nUntil we arrive\nAt the City of our good King.\n\nWe are journeying on,\nNow is very near at hand\nThat day of rejoicing,\nIn which they shall triumph\nAll who are washed,\nIn the blood of our Redeemer."
  },
  "288": {
    "title": "To the Cadence of a Thousand Voices",
    "lyrics": "To the cadence of a thousand voices\nAnd a song of praise,\nWe give honour and glory\nUnto our Saviour.\nFor He is worthy of honour,\nOf glory and praise;\nTherefore we sing\nUnto our Saviour.\n\nCHORUS: Thus is He blessed\nOur Saviour,\nThus is He blessed for His goodness\nThus is He blessed,\nOur Saviour;\nAnd blessed be He\nThroughout all eternity.\n\nTo the cadence of a thousand voices\nAnd spiritual song,\nThe soul doth rejoice\nAnd our heart within\nBecause well we know:\nThat Christ hath died,\nAnd upon a cruel tree\nHe gave up His life.\n\nTo the cadence of a thousand voices\nAnd a heavenly choir,\nOf angels in heaven\nSinging to the Immortal One,\nO glory to the Lamb\nWhat joy it will be,\nTo sing up yonder in heaven\nThroughout a long eternity."
  },
  "289": {
    "title": "Like a Sweet and Nightly Strain",
    "lyrics": "Like a sweet and nightly strain,\nEchoing from the mount\nOf Him who earnestly seeketh,\nHis lost possession,\nEver it cometh from yonder,\nWhere Christ doth reign,\nA voice that saith with love;\n“Come, sheep... come”.\n\nCHORUS: Come, after Me, following\nMy footsteps; of the fold,\nThe door standeth open wide\nHearken then to the voice of Him that calleth thee\nCome to Him, and heaven shalt thou enjoy.\n\nThou who wanderest today,\nFar away from the flock\nAfter a deceiving world\nWhere thou shalt be lost.\nThe loving, faithful Shepherd,\nHearest thou not that He calleth thee,\nForsake now thy evil deeds\nAnd blessed shalt thou be.\n\nThe devil, the tempter,\nIs transformed into an angel;\nAnd if already thy hurt he hath wrought\nTo mock at thee,\nYet near at hand is Jesus\nThe loving Shepherd,\nWho with faithful care,\n“Come...” saith unto thee, “come”."
  },
  "290": {
    "title": "Walking, Walking",
    "lyrics": "Walking, walking\nToward the city of Zion;\nWhere Jesus Christ abideth,\nMy blessed Saviour,\nWhere the King of kings abideth,\nAnd the Conqueror of the world.\n\nCHORUS: Zion of the Lamb,\nHeavenly mansion,\nDwelling-places which Christ,\nWent to prepare for us.\nThere He receiveth all those,\nWhom at the price of blood…\nHe came to redeem.\n\nWalking and remembering,\nWhen Christ spake thus:\n“::Go, deny thyself\nTake up thy cross and come to Me::”\n\nWalking and remembering,\nWhen He gave the Holy Supper;\n“His blood of the new covenant\nBrought unto us eternal Life::”\n\nWalking and remembering,\nWhen He spake with charity;\n“Whosoever cometh unto Me\nThough he be dead, yet shall he live::”\n\nJesus Christ in speaking said:\n“A new commandment I give unto you\n::That ye love one another,\nAnd so shall ye abide in My love::"
  },
  "291": {
    "title": "He Is Risen! Proclaim the Tidings",
    "lyrics": "He is risen! Proclaim the tidings\nTo the world that saw His death;\nHe took our place upon the cross,\nYet from the tomb He rose again.\n\nCHORUS: Why seek ye Christ there?\nAmong the dead He is no more,\nWeep not for Him, but sing, rejoice,\nAnd proclaim:\nThat Christ now lives and reigns!\n\nIn sorrow did they see Him buried,\nAll who in Him had placed their faith,\nAll hope now being dead\nThey thought to bury there with Him.\n\nYet the sepulchre could not\nWithin its prison-bonds retain\nChrist the King, who as Conqueror,\nTriumphed o'er death and all its power.\n\nHe is risen! No more shall there be,\nShadows of death for the faithful;\nThough he should die, yet shall he live,\nWhosoever believeth in Him alone."
  },
  "292": {
    "title": "Unto the Garden They Go to Visit",
    "lyrics": "Unto the garden they go to visit,\nThe tomb wherein His body lies;\nWomen are they who go to anoint Him,\nYet who shall roll the stone away?\nO who, yea, who shall roll it away?\n\nCHORUS: Fear ye nothing, go to the garden,\nBehold His tomb now opened wide;\nHe whom ye seek is not dead,\nHe is risen indeed!\nFear ye nothing, He lives and reigns,\nYour Master and Lord,\nConqueror, Conqueror,\nConqueror over the grave.\n\nNailed was He to the cruel cross,\nAnd there Jesus yielded up His life;\nHis feet, His hands they would kiss,\nYet who shall roll the stone away?\nO who, yea, who shall roll the stone away?\n\nHave ye lost that which ye love?\nIs your hope departed and gone?\nWhy go ye seeking a dead Christ?\nGod hath already rolled the stone away!\nYea, God, my God hath rolled it away!"
  },
  "293": {
    "title": "I Feel Great Joy Within My Soul",
    "lyrics": "I feel great joy within my soul,\nFor that which I feel in my heart;\nFor what Christ hath wrought in my being,\nEver since my conversion.\nThough I was so unworthy and unfaithful,\nMy whole life He hath transformed\nAll my vices He hath taken away,\nAnd I sing unto Him who died for me.\n\nCHORUS: Here today we give Thee praise,\nFor Thy mercies, O Lord;\nWhich Thou hast shown\nUnto unfaithful man.\nAnd unto sinful man,\nWho wandered without direction;\nStraying, far from Thy fold,\nThou hast been able to redeem him.\n\nI walk in newness of life unto this day\nMy heart overfloweth with love;\nBecause I belong to His flock,\nMy Lord hath brought me in.\nNow I rejoice in His lovingkindness,\nI receive every day a blessing;\nHis Spirit He gave me in His grace,\nAs a seal of confirmation.\n\nIf I suffer reproach for Thee,\nThou didst suffer first for me\nAn example Thou gavest us here,\nThat we might learn of Thee.\nNow I sing and live rejoicing\nIf I live now, I live for Thee;\nNow I beseech Thee, O Lord,\nThat Thou keep me in Thy fold."
  },
  "294": {
    "title": "There Came a Messenger as His Forerunner",
    "lyrics": "There came a messenger as a forerunner of Him,\nHe was a faithful servant and preached with power;\nJohn was his name and he baptized in Jordan;\nHe exhorted them that they should sin no more.\n\nCHORUS: In the beginning was the Word,\nAnd the Word was with God;\nAll things were made by Him,\nIn Him was life,\nAnd the light of men also.\n\nHe came unto His own, but they received Him not,\nThose who received Him, He made sons of God;\nUnto those who obey the Word which He hath spoken,\nThey shall live and rejoice in His Mansion.\n\nJoy I feel in my soul when I praise my \nLord,\nAs the King who cometh with immense splendour:\nSweet is it unto me to hear His tender voice,\nGlory to His Name for this sublime love.\n\nCome, friend, to Christ, He will give thee thy salvation,\nHe will change thy life from this sorrowful estate;\nWander no more in that dense darkness,\nBehold, eternal death awaiteth thee beyond."
  },
  "295": {
    "title": "To Be Desired Is the Mount of Zion",
    "lyrics": "To be desired is the mount of Zion,\nRunning unto it go\nAll the nations;\nTo give praises unto the King,\nRendering adoration unto Him.\n\nCHORUS: Mount of My holiness,\nThou shalt be called\nZion of the Lamb of God;\nFor upon the arm of God,\nThou art graven,\nAnd in the heart of God\nThou art sealed.\n\nO blessed Church of God!\nThou art growing through Him,\nIn His lovingkindness,\nTo love Him forevermore\nEven Jesus, our blessed King.\n\nIt was Jesus who gave thee life,\nConsecrated by Him\nIn His virtues,\nMayest thou be loved by Him forever.\nSo desire the children of the King."
  },
  "296": {
    "title": "I Feel the Fire",
    "lyrics": "I feel the fire of Thy love\nWithin my soul,\nI feel my heart filled with Thy love,\nAnd also all this hath brought sweet calm\nI am happy believing in Thee, Lord.\n\nCHORUS: Fill me, Lord, with Thy presence\nI desire to serve Thee with love,\nAnd also to enjoy Thy mercy\nI would be with Thee in the mansion.\n\nI am happy believing in Thee\nLord of heaven,\nI have peace and in Thee security\nAnd gathered\nWith the angels of heaven,\nTo worship Thee for eternity.\n\nToday I feel clothed\nWith Thy grace,\nI feel faith and confidence in Thee, Lord,\nClothed each day\nWith hope,\nThere shall be none to sever me from Thy love."
  },
  "297": {
    "title": "Jesus, Finding Me Lost",
    "lyrics": "Jesus, finding me lost\nSaid unto me: Come to the light;\nNow He hath granted unto me,\nThat I should bear His cross.\n\nCHORUS: I shall behold,\nThe wondrous splendour\nAlready it begins to gleam;\nShining forth as a luminary,\nThe face of my Jesus.\n\nTherefore joyful we will sing,\nUnto the King of glory, Jesus;\nBecause He hath granted unto us,\nThat we should bear His cross.\n\nTherefore we are journeying on,\nFor at last we shall arrive,\nIf we be ever faithful to Him\nHe will crown us.\n\nWhen thou art found in glory,\nSinging to the heavenly King;\nThere shalt thou render praises,\nWith spiritual joy.."
  },
  "298": {
    "title": "Jesus Christ Shall Lead Away",
    "lyrics": "Jesus Christ shall lead away\nThose who trust in Him\nHe will say to them: Come ye,\nCome, My faithful servant\n\nCHORUS: Come, My faithful servant\nI will crown thee,\nThou hast been faithful over a few things\nI will set thee over many things,\nCome, My faithful servant\nI will crown thee\nThou hast been faithful over a few things\nI will set thee over many things.\n\nBlessed is that servant\nWhom his Lord,\nShall find so doing\nAlways in prayer.\n\nUnto the servant who is faithful\nAnd who watcheth in love\nThe Lord shall say\nCome, My faithful servant."
  },
  "299": {
    "title": "I Wandered Forsaken",
    "lyrics": "I wandered forsaken,\nWithout a course was I found,\nI sought for pleasure in vain\nI searched everywhere, yet found it not.\n\nCHORUS: But one day I met with Christ\nHe showed me His great love,\nHe filled my heart with joy\nAnd my heavy burden He bore.\n\nI spent a great part of my life,\nSearching for happiness.\nThe world could give me nothing\nI saw myself lost in wickedness.\n\nNow I have a faithful Friend\nWho ever careth for me,\nHis life He gave upon the tree\nTo give unto me salvation.\n\nThe world offered me pleasures\nSeeking rather my destruction,\nBut I found a faithful Friend\nWho gave me His protection."
  },
  "300": {
    "title": "We Bless Thee",
    "lyrics": "We bless Thee, we adore Thee\nWe glorify Thy name, O God!\nO King of heaven, hear in mercy\nOur fervent and humble voice!\n\nCHORUS: Holy, Holy, Holy\nThy glory filleth heaven and earth\nHosanna, hosanna, glory to God!\n\nLook not on man's ungodly trespass\nBehold Thy Son, my Redeemer;\nThen fervent shall my soul\nBe able to praise Thee with all its love.\n\nMay we be worthy to bless Thee\nWith soul cleansed from all evil;\nLet heaven and earth sing Thy Name\nO God! O Father, heavenly King!"
  },
  "301": {
    "title": "He Cometh, He Cometh",
    "lyrics": "He cometh, He cometh,\nJesus our eternal Lord,\nThe King of all kings,\nLord of lords, He cometh in light.\n\nCHORUS: He cometh, He cometh, our King,\nThe heavenly choirs give Him praise,\nFor He is our King.\n\nHe cometh, He cometh,\nThe Holy Lamb, who died on the cross,\nWho took the book,\nFor He alone is worthy of all power.\n\nIn resplendent light,\nThat lighteth the heavens He shall be seen coming,\nComing in glory, with mighty power,\nOur Savior."
  },
  "302": {
    "title": "I Will Follow Thee, Master",
    "lyrics": "I will follow Thee, Master,\nIn Thy way of life;\nBeautiful words of life,\nFor Thou art God Himself.\n\nCHORUS: I will follow my Lord,\nFor my Christ is my all,\nEver He hath been and ever shall be.\n\nI will follow Thee, Master,\nAll the days of my life,\nThough the world should hate me,\nI will ever follow with Thee,\nBecause I feel so blest.\n\nI will follow Thee, Master,\nNever suffer me to deny Thee,\nMake me valiant in the battle,\nThat I may never betray Thee,\nI desire to be more faithful to Thee.\n\nI will follow Thee, Master;\nWhithersoever Thou goest,\nThy people shall be my people,\nWith Thee I desire to live,\nI will be obedient unto the end."
  },
  "303": {
    "title": "In the Heat of the Battle",
    "lyrics": "In the heat of the battle,\nI cry unto Christ without doubting;\nWhen my strength faileth me,\nChrist doth take my place.\n\nCHORUS: The grace of Jesus Christ\nIs sufficient for me;\nIf these trials be sore,\nHe will bear them for me,\nAnd thus shall I overcome.\n\nIn the hours of trial\nMy Lord doth sustain me;\nWhen I feel I am weak,\nHe giveth me strength and courage.\n\nThis warfare is not ended\nSo long as I must live;\nIf my Christ doth uphold me,\nThe victory is for me."
  },
  "304": {
    "title": "My Soul Sacrificeth Her Sweet Song",
    "lyrics": "My soul sacrificeth her sweet song\nUnto the honor of my God,\nUpon His heavenly throne\nMy soul, exceeding joyful, rendereth tribute unto God.\n\nCHORUS: Hallelujah, Glory to God!\nO my soul, sing thou yea;\nUnto thy God who is Jesus Christ;\nHe clotheth thee and comforteth thee\nIn thy great affliction.\n\nMy soul sacrificeth praise unto God\nWith all freedom and spiritual joy,\nFor Christ hath bestowed it\nIn His lovingkindness.\n\nBless, O my soul, thy Comforter\nWith songs of praise unto my Heavenly Father,\nWho delivereth thee from sorrow;\nGlorify thou God.\n\nMy soul doth rejoice in Christ my King,\nAnd lifteth up in love her spiritual song,\nUnto the glory of my Christ,\nFor He hath been faithful."
  },
  "305": {
    "title": "Seek Me, O Lord",
    "lyrics": "Seek me, O Lord,\nIf astray I go;\nSeek me, O Lord,\nSeek me today,\nSeek me, here am I.\n\nCHORUS: In Thee is my soul,\nIn Thee is my being.\nIn Thee is also\nAll my thought,\nSeek Thou Thy servant,\nFor I have not forgotten\nThy commandments.\n\nSpeak to me, O Lord,\nI desire to hear Thy voice,\nVoice of tenderness,\nVoice of love,\nSpeak to me, O Lord.\n\nCall me, O Lord,\nCall me in love,\nI will know Thy voice,\nO Good Shepherd,\nCall me, O Lord.\n\nI feel that my being\nIs far from Thee,\nAnd I long for Thee to be\nNear unto me,\nAnd blest shall I be."
  },
  "306": {
    "title": "History Tells Us That...",
    "lyrics": "History tells us, that there in a village,\nBearing the name of Bethlehem of Judea,\nBorn of a virgin, of the Hebrew race,\nWas a child who unto the world, salvation should give.\n\nCHORUS: Of the blood of kings,\nWith a soul divine,\nBearing in His eyes\nThe celestial light;\nChrist is like the water,\nPure and crystalline,\nThat becometh a fountain\nOf eternal life.\n\nSpotless in body, unblemished in soul,\nHe grew as the lovely flower doth grow,\nTo give unto the world a placid calm,\nWhich, like sweet perfume, spreadeth His love.\n\nThe holy prophets, those holy men of old,\nMany years before foretold that unto Him\nAll the nations would turn their eyes,\nTo honor the sweet name of Emmanuel.\n\nAnd the prophecies that are being fulfilled,\nIn these our days, with great precision,\nAre only understood by those who believe\nIn Jesus the Christ, unto salvation."
  },
  "307": {
    "title": "How Glorious",
    "lyrics": "How glorious the change that is wrought in my soul,\nWhen the Lord came into my life;\nIn my soul is a peace that I longed to possess,\nThe peace which His love brought to me.\n\nCHORUS: He came into my heart,\nHe came into my heart;\nI am blest with the life that Christ gave unto me,\nWhen He came into my heart.\n\nI walk no more in the path that evil had traced,\nWhere only confusion I found;\nMy past transgressions Jesus blotted out,\nWhen He came into my heart.\n\nNot a shadow of doubt can darken His love,\nThe love that brought pardon to me;\nThe hope that I cherish I owe to the Lord,\nWhen He came into my heart."
  },
  "308": {
    "title": "Unceasingly I Ponder",
    "lyrics": "Unceasingly I think of that heavenly land,\nWhere, when my sun hath set, I shall arrive;\nAnd finding myself in the arms of Christ the Lord,\nMy crown of stars I shall have.\n\nCHORUS: My crown shall have its stars there,\nIn the souls that He redeemed;\nWhen the sun doth decline,\nAnd I find myself in Thee,\nMy crown shall have its pearls.\n\nTrusting in God's strength and awaiting His power,\nI would ever labor in His harvest field;\nWith the souls, and at last,\nEven as stars to know\nThat upon my brow they shall shine.\n\nOh, what joy in the heavens shall be unto me,\nLiving gems to lay at His feet,\nAnd to wear on my brow\nA crown whereon there,\nJewels of such brilliance shall shine."
  },
  "309": {
    "title": "O Soldiers of Jesus",
    "lyrics": "O soldiers of Jesus, be ready now,\nHaving your loins girded with the peace\nOf God; if thou fightest faithful to glory\nThou shalt go, and in thy crown diadems shall shine.\n\nCHORUS: Who will say… Here am I,\nI will go… to fight,\nTo fight for the cause of the Lord.\nWho will hear… this voice\nAnd will say… with courage,\nI will go to labor for my Lord.\n\nIt is time to fight earnestly,\nFor the redeeming work of the Lord Jesus,\nLifting high the standard with power,\nThe blessed doctrine of the Lord.\n\n'Tis now time to shine everywhere\nWith the blessed sword of the Lord Jesus,\nThe word of truth and love,\nAnd the shield of all holiness.\n\nWho will be the first to say: I,\nI will go, to the towns and villages whither the\nLord may send me, preaching with power,\nFrom the Lord, the blessed word of salvation."
  },
  "310": {
    "title": "I Serve a Living Christ",
    "lyrics": "Unto Christ I live and serve; in my soul is He,\nThough others should deny Him, I know He liveth now;\nThe Holy Spirit my Savior giveth me,\nHe never doth forsake me; He is my Guide.\n\nCHORUS: /:/He lives/:/ today the Savior lives,\nHe is with me; He is my Shepherd, my eternal Redeemer.\n/:/He lives/:/ He keepeth me by His love;\nI know that He is living, for He lives\nWithin my heart.\n\nNow all the whole world beholdeth His power,\nAnd every man trembleth, knowing that He shall come;\nConfident am I that Christ will keep my soul,\nAnd that unto the world He will return again.\n\nRejoice, ye Christians, sing unto the Savior,\nEverlasting praises to Christ the King now sing;\nHe is the only hope of a sinful world,\nThere is none other so loving as the Lord."
  },
  "311": {
    "title": "Father, at Thy Feet I Bow",
    "lyrics": "Father, at Thy feet I bow,\nBreak my heavy bonds asunder;\nOh! Answer while I call,\nPut Thy Spirit in me.\n\nCHORUS: Put Thy Spirit in my soul,\nMake me what I ought to be;\nMake me pure in all things,\nFree from every sin;\nPut Thy Spirit in me.\n\nWhile Christ doth intercede,\nWhile I humbly pray;\nGrant me that which I have need of,\nPut Thy Spirit in me.\n\nI desire not to offend Thee,\nI will live to please Thee;\nAnd within my heart to keep Thee,\nPut Thy Spirit in me.\n\nDeliver me from orphanhood,\nLeave me not to perish;\nKeep me in Thy holy bosom,\nPut Thy Spirit in me."
  },
  "312": {
    "title": "Servants and Handmaids of God",
    "lyrics": "Ye servants and handmaids of God,\nBring ye into the storehouse,\nThat there may be meat in My house,\nThus saith the Lord,\nThus saith the Lord.\n\nCHORUS: God shall send down a blessing,\nUnto the cheerful giver,\nShowers of grace and love,\nFrom the throne of His Mansion.\n\nA freewill offering,\nFor the work of the Lord;\nThe reward shall be given by\n/:/Christ the Savior/:/\n\nHe that soweth in blessing,\nThe same shall also reap;\nHe that soweth sparingly,\n/:/His fruit shall be sparing/:/\n\nThe rich are now imitating\nThose whom Christ beheld;\nYet that poor widow of old,\nTwo mites she cast in,\nAll that she had she gave."
  },
  "313": {
    "title": "God Bless This Offering",
    "lyrics": "God bless this offering thou hast given,\nThis offering thou givest in love;\nThis offering shall have blessings,\nIn blind faith it shall have a reward.\n\nCHORUS: Much beloved shalt thou be of the Lord,\nIf this offering thou givest in love;\nBlessing in abundance He will give thee,\nAnd into His Kingdom He will receive thee.\n\nOf the substance the Lord hath given thee,\nThou hast brought this offering to the altar;\nIf with joy thou givest it, not grudgingly,\nBlessing never shall fail thee.\n\nThis offering thou givest to thy brother,\nJesus Christ will repay unto thee;\nWhen thy name is heard in Heaven,\nEternal Life the Lord will give thee.\n\nOur Father Abraham gave tithes\nUnto God's minister Melchizedek;\nIf the Church be the Seed of Abraham,\nToday the works of Abraham must she do."
  },
  "314": {
    "title": "Serving the Savior",
    "lyrics": "Serving the Savior, great love is felt within;\nRendering adoration with all the heart.\nThus ought we to worship Him who set us free,\nWho died upon the cross, and for thee and me suffered the pain.\n\nCHORUS: Unto the only God be the honor,\nWho delivered us by His power;\nTo bring us unto His mansion,\nTo dwell there with Him.\nForever, amen.\n\nGive Him thine heart, if thou wouldest attain\nThe blessings from Him thou mayest enjoy;\nLiving in communion with Christ the Good Shepherd,\nThou shalt enjoy that peace, that peace which the Lord doth give.\n\nThe conflicts shall cease by the side of the Lord;\nAnd thy soul shall delight in His perfect love.\nThe angel of the Lord encampeth round about thee,\nFor faithful is the promise, and His word He will fulfill.\n\nIf thou wouldest be a sheep of Christ the Good Shepherd,\nLeave this cruel world with all its vain illusion,\nAnd at His feet rest shalt thou find,\nAnd thus shalt thou be able to say, that Christ is thine,\nAnd thou art His."
  },
  "316": {
    "title": "Jesus Christ Alone Is God",
    "lyrics": "Jesus Christ alone is God, and there is none other;\nNeither in heaven nor on earth, nor in the deep of the\nsea.\nHe is Author of the universe, who came to save mankind;\nAnd He is the One prepared, to come and judge.\n\nCHORUS: And the church in His Name,\nWhich Christ established;\nIs the door that standeth open\nUnto him that seeketh salvation.\nThough there be many other doors\nThat shall not prevail;\nAnd if they have stood open;\nChrist cometh to shut them.\n\nMany deny Christ today, and proclaim the\nTrinity,\nWith arrogant words, which are pure vanity;\nThese are false teachers, who deceive all\nhumanity,\nWho will not worship, in Spirit and in Truth.\n\nYet if they repent, Christ will forgive them;\nHe will bring them to His fold, and Himself shall lead them.\nWe shall be one flock, and one Shepherd shall there be;\nThe One who careth for our souls, for we all belong to\nHim."
  },
  "317": {
    "title": "Like a Fragrant Rose",
    "lyrics": "Like a fragrant rose,\nLike abundant rain,\nIs the peace that Jesus hath given me.\nLike the tender freshness of a woodland plain,\nIs the peace that Jesus hath given me.\n\nCHORUS: The peace that Christ hath given me,\nFrom high heaven hath come down,\nLofty and sublime\nAs the vast expanse,\nIs the peace that Jesus giveth me.\n\nLike a rising star,\nIn a radiant sunset,\nIs the peace that Jesus hath given me.\nLike a precious song\nAnd like sweetest rest\nIs the peace that Jesus\nHath given me.\n\nLike a refuge sublime,\nThat restoreth life,\nIs the peace that Jesus\nHath given me,\nLike a faithful joy\nIn the daily strife\nIs the peace that Jesus\nHath given me."
  },
  "318": {
    "title": "This Commandment Christ Hath Given Us",
    "lyrics": "This commandment, Christ hath given us,\nThat we all may live in His love;\nIt was the Father's love that saved us,\n/:/He hath sent unto us His beloved Son,\nFor salvation/:/\n\nCHORUS: Follow... follow... Christ thy Lord,\nHe hath... He hath... something for thee,\nLife... life... life He will give to thee.\n/:/Never wander away... never depart\nFrom thy Savior/:/\n\nChrist doth teach us His perfect love,\nWe ought to love one another even as He loved us;\nAnd if we obey that which He commanded us,\n/:/Whatsoever we ask in His holy Name\nHe will grant unto us/:/\n\nLet us never grow weary in doing good,\nFor the reward Christ shall give to thee,\nWhen He shall sit upon His judgment seat,\n/:/Whether it be good, or whether it be evil,\nHe will recompense us/:/"
  },
  "319": {
    "title": "Hear, All the Earth, Who Jehovah Is",
    "lyrics": "Hear, all the earth, who Jehovah is,\nThe works of His hands shall declare Him;\nThe heaven of heavens belongeth unto Jehovah,\nWe ought to worship Him in Spirit and in Truth.\n\nCHORUS: Let us all praise the Lord God Jehovah,\nAll ye young men, give praise unto Him;\nLet us all praise God the Creator,\nAnd all ye maidens,\nOld men and children, praise ye Jehovah.\n\nPraise the Most High God, sun and moon,\nAnd all ye stars, for He created them;\nHe made them forever and for all ages,\nHe gave them a decree in all things, which they shall ever keep.\n\nLet the deeps praise King Jehovah,\nAnd fire and hail and vapor;\nThe thunder and the stormy winds,\nPraise that glorious Name of Jehovah.\n\nThe mountains and hills and the wide sea,\nPrinces and kings and every being,\nThe birds of the heavens and every creeping thing,\nAnd whatsoever hath breath, praise Jehovah.\n\nLet His saints praise Him, whom He hath formed,\nWith songs of praise and thanksgiving;\nHis glory is in the heavens and in the earth,\nLet the people near unto Him praise Jehovah."
  },
  "320": {
    "title": "Every Faithful Christian Who Loves His Lord",
    "lyrics": "Every faithful Christian who loves his Lord,\nWalks in righteousness and lives by faith;\nHe walks not by sight, he knows where he goes,\nIn search of Christ's home by faith.\n\nCHORUS: By faith I shall see my Lord and God,\nIn matchless glory;\nBy faith I shall live with Him,\nFor all eternity.\n\nThere is a mansion already prepared,\n'Tis a faithful promise of my Savior;\nFor the Christian who from the heart\nKeeps His commandments and lives in love.\n\nEvery faithful Christian who is on earth,\nGiving honor and glory to his Savior;\nWhen he is sick, he hath no fear,\nFor the Lord heals him by faith alone.\n\nHe that would see Christ my Lord,\nMust be sanctified by faith alone;\nHe must cleanse his whole heart,\nFor without holiness no man shall see the Lord."
  },
  "321": {
    "title": "Hallelujah, for the Lord",
    "lyrics": "Hallelujah, for the Lord\nGives us great salvation,\nLiberty, liberty!\nOur God hath power\nTo conquer Satan\nAnd deliver us from him.\n\nCHORUS: Liberty and redemption,\nHallelujah, Christ already\nDelivered us and saved us;\nGlory, glory, hallelujah!\nHe is all, in all is He.\n\nWe will trust in Jesus,\nHe gives us holiness\nAnd also liberty;\nNow we enjoy sweet peace\nSince He redeemed us\nAnd gave us liberty.\n\nWe will ever sing thus,\nWhile we live here below,\nLiberty, liberty!\nPraises to the Lord\nWe will sing with fervor,\nFor His love which He gave us."
  },
  "322": {
    "title": "Jesus Has Compassion",
    "lyrics": "Jesus has compassion on the saints in His love;\nHe invites us without ceasing to the Heavenly Homeland,\nMultitudes followed Him, hearing Him preach;\nThe miracles that He wrought were a marvel to behold.\n\nCHORUS: Come and dine here with Christ,\nCome and see;\nOf the manna that Christ gives,\nCome and eat;\nHunger and thirst He will take away\nIf thou accept Him in truth,\nThou shalt go to dwell with Christ\nThroughout all eternity.\n\nFor the Lord to give thee that great Comforter,\nThou must forsake evil and live in holy love.\nChrist never made exception, nor kept any secret back;\nUnto those who waited in faith, He gave of His Spirit.\n\nThe great manifestation of tongues and the shaking\nIs for those who believe in God, and give Him their heart.\nAs Christ transformed the water into wine, and gave it to drink:\nEven so He transforms men in the spiritual life.\n\nJesus Christ gave food to eat unto a great multitude,\nWho followed Him in hunger, doubting His power.\nFive loaves and two fishes the Lord multiplied;\nThey ate to their satisfaction, and much more was left over."
  },
  "323": {
    "title": "Reverence the Name of Jehovah",
    "lyrics": "Reverence the Name of Jehovah,\nFor the Angel of the Lord;\nIs among us,\nReverence the Name of Jehovah.\n\nCHORUS: Blessed is the King that cometh,\nHe shall reign forevermore;\nAnd the people of Israel\nIn the clouds He shall lift up.\n\nReverence the Name of Jehovah,\nLet man repent\nOf all his iniquity;\nAnd come to Christ; He can forgive him.\n\nReverence the Name of Jehovah,\nFor Christ will return;\nIn the clouds He shall come,\nEvery eye shall see Him."
  },
  "324": {
    "title": "Your Pathway May Be",
    "lyrics": "Your pathway may be\nA path of delight,\nIf there is joy in your soul,\nIn darkness you will shine\nLike a beam of bright cheer\nIf there is joy in your heart.\n\nCHORUS: If there is joy in your soul... your soul,\nYou will be able to brighten\nYour pathway as you walk,\nForgetting your sorrow... sorrow\nIf there is joy in your heart.\n\nYou will calm the heart\nAngry without cause,\nIf there is joy in your soul;\nYou will win by your deed\nA rich blessing indeed,\nIf there is joy in your heart.\n\nTo a brother you can give\nGreater courage in his grief,\nIf there is joy in your soul,\nSharing in his deep pain\nWith tenderness and love,\nIf there is joy in your heart.\n\nYou will live in sweet peace,\nAccepting the Savior,\nAnd will go to His mansion,\nAnd your soul will rejoice\nIn the love God bestows,\nAnd you'll see Christ the Savior."
  },
  "325": {
    "title": "The Courage God Has Given Me",
    "lyrics": "The courage that God has given me,\nI will not let it fade away;\nDiscouragement has left me now,\nToday I only desire to praise Jesus Christ.\n\nCHORUS: Give me more courage, O Jesus Christ!\nAnd Thy way I will never leave;\nGive me more courage, O blessed Christ!\nAnd with glad courage I will serve Thee.\n\nThe courage that God has given me,\nThe enemy has sought to take away,\nHe who has ever fought against me\nWith cunning craft to make me faint.\n\nI shall have more struggles against the adversary,\nAnd I shall have to battle on;\nYet my Christ will grant me His help,\nAnd great courage, that I may not faint.\n\nA renewed courage my God has given me,\nWhen I was about to succumb;\nHe lifted up my fallen spirit,\nIn His way I must follow Him."
  },
  "326": {
    "title": "Christ Is the Rock of Salvation",
    "lyrics": "Christ is the Rock of salvation,\nFountain of tenderness,\nMy friend, my God,\nHe is the Light that illumines\nEvery heart.\nOnly by His grace,\nBlessed be His Name,\nFor He saved me.\n\nCHORUS: Oh, what great torment\nJesus endured!\nMy sins were\nAll His grief; unworthy I feel,\nA foolish sinner, for having offended\nMy Savior.\n\nHis sacrifice was\nTerrible for me;\nMockings, blasphemies, lies,\nThere all were striving\nTo see Him die,\nHe who in His glory\nHas risen, because He is to come.\n\nCome, then, my Christ,\nCome quickly, waiting for Thee,\nThy people wait for Thee,\nFaithfully they shall abide;\nThey love Thy Coming, they are prepared\nTo receive Thee when in glory\nThey come to reign with Thee.\n\nThy believing people watch without ceasing,\nConstantly vigilant, praying more and more;\nThey know not the day wherein Thou shalt come,\nTherefore with joy we praise Thy Name,\nUntil Thy coming."
  },
  "327": {
    "title": "I Follow Christ",
    "lyrics": "As long as here on earth\nI remain, I will fight,\nI will fight, I will fight\nAgainst Satan,\nFor Christ is my mighty Captain.\n\nCHORUS: I will fight, 'tis my duty to fight,\nAided by the Lord Jesus;\nYea, yea, I shall overcome\nThe prince of evil.\n\nOn the right hand and on the left,\nFor Christ I will fight\nWith courage and with faith;\nWith courage I will overcome,\nThe help of Christ I shall have.\n\nThe winds that beat\nWith a mighty tempest,\nSeeking to destroy\nThe truth of my soul;\nYet Christ will never leave me."
  },
  "328": {
    "title": "They Came From the East",
    "lyrics": "From the East there came\nWise men seeking\nChrist, the King of kings,\nWho is Jesus, the great Lord.\nThey brought great treasures\nTo offer to the Savior\nOf the whole universe,\nJesus Christ the Redeemer.\n\nCHORUS: Gold, frankincense, and myrrh,\nAnd all they offered\nTo the Lamb in love;\nAll was received,\nYet of greatest delight\nWas their humble adoration.\n\nWe come from the East\nAnd the West, Good Shepherd,\nDesiring that Thou impart to us\nA great blessing.\nWe come to sing unto Thee\nAnd to offer Thee our heart;\nDesiring that Thou receive it\nAs an offering of love.\n\nJesus, the King of kings,\nDescended from the heavens,\nTo save souls\nFrom sin and perdition.\nHe willed not to see\nOur souls lost in error;\nAnd He offered up His life\nTo give us salvation."
  },
  "329": {
    "title": "The New Sun That Shall Shine in Zion",
    "lyrics": "The new Sun that shall shine in Zion\nShall be the Lamb of God;\nWith His beams He will illumine\nHis Holy City.\n\nCHORUS: In my city there\nThere is no need\nOf earthly light;\nFor Jesus is the Light,\nIn His Holy City.\n\nThe new Sun that shall shine in Zion\nIs Jesus Christ the Lord;\nHe illumines with His holiness\nThe Holy City.\n\nThe Light of God is the faithful Lamb,\nHoly Lamb of God;\nAnd His glory shall be reflected\nIn His Church.\n\nFaithful Church, seek holiness\nTo enter before thy King;\nHe who hath already prepared\nHis Holy City."
  },
  "330": {
    "title": "Beloved Soul",
    "lyrics": "/:/ Dear soul, where wanderest thou?\nIn darkness thou wilt be lost /:/\n\nCHORUS: /:/ Thou hast no excuse, thou hast no pardon,\nThe gates of Zion are not open to thee /:/\n\n/:/ If Jesus Christ should come this day,\nWhat reason wilt thou give? /:/\n\n/:/ For refusing to believe, for failing to obey,\nThrough thine own stubborn will thou shalt be lost /:/\n\n/:/ Today we invite thee, O vile sinner,\nFor in Jesus Christ thou shalt find pardon /:/\n\n/:/ 'Tis a delight to meditate\nUpon that precious and beautiful city /:/\n\n/:/ In that precious and beautiful city\nThe redeemed shall enter into joy /:/"
  },
  "331": {
    "title": "In the World I Only Live for Christ",
    "lyrics": "In the world I only live\nFor Christ.\nAt Calvary\nWith His blood He purchased me,\nWith the blood\nFrom His side He washed me,\nAnd therefore\nI only live for Him.\n\nCHORUS: In the pathway Thou hast marked,\nI will follow Thee, Jesus;\nTrusting that Thy hand\nWill ever guide me in the light,\nEven up the heavy hill\nWhich Thou climbedst with Thy cross;\nIn the bitterest of struggles,\nIn Thee will I hope, Jesus.\n\nI pray Thee to keep me\nAlways faithful,\nThat Thou have mercy upon me,\nEven despite my sin.\nThat Thou wash my heart,\nYea, more and more;\nThou rememberest that for me\nThou drankest gall.\n\nIf Thou wilt guide me ever,\nI will follow Thee,\nThough my steadfast feet\nShould come to bleed.\nI, with Thy heavy cross,\nAm to arrive\nAt Calvary,\nWhere in joy I shall sing."
  },
  "332": {
    "title": "Come Unto Jesus Christ Without Delay",
    "lyrics": "Come unto Jesus Christ without delay,\nFor in our midst He is today,\nAnd He invites thee with tender care,\nSweetly saying: Come.\n\nCHORUS: Oh! How sweet our gathering shall be,\nWhen yonder, Lord, in Thy mansion;\nWe be with Thee in sweet fellowship,\nEnjoying eternal bliss.\n\nThink that He alone can fill\nThy sorrowing breast with joy and peace;\nAnd because He longs for thy welfare,\nHe says to thee once more: Come.\n\nHear His voice without wavering,\nAnd gladly receive what He gives thee today;\nPerchance tomorrow there will be no room,\nTarry no longer: Come."
  },
  "333": {
    "title": "The Life That I Have, I Owe Unto Jesus",
    "lyrics": "The life that I have,\nI owe it to Jesus, my Lord;\nHe has purchased me with great sorrow,\nHis blood He gave for my redemption.\n\nCHORUS: Lord, let me not go from Thy hand,\nRemember me in my battling;\nUphold me through Jesus, Thy beloved Son,\nThat I may walk in Thy doctrine.\n\nOffenses and insults,\nAll did my Lord endure for me;\nAll to grant me a better life,\nAnd thus to show me His blessed love.\n\nScorn and blasphemies\nDid blessed Jesus bear for me;\nAnd thus nailed to the cruel cross,\nHe suffered to give me truth and light."
  },
  "334": {
    "title": "Oh, What a Friend We Have in Christ!",
    "lyrics": "Oh, what a Friend we have in Christ!\nHe hath borne our every grief;\nAnd He bids us that we carry\nEverything to God in prayer.\nDoth man live bereft and destitute\nOf peace, joy, and holy love?\n'Tis because we do not carry\nEverything to God in prayer.\n\nArt thou weak and heavy laden,\nFull of anxious cares and fear?\nUnto Jesus, eternal refuge,\nTell Him all in faithful prayer.\nDo thy friends despise and spurn thee?\nTell it unto Him in prayer;\nIn His arms of tender mercy,\nPeace thy heart shall surely find.\n\nJesus Christ is our true Friend,\nProof of this He gave to us;\nWhen He suffered the cruel punishment\nWhich the guilty one deserved.\nAnd His people, now redeemed,\nEver shall find safety sure;\nTrusting in this Friend Eternal,\nAnd relying on His grace."
  },
  "335": {
    "title": "God Bless the Souls United",
    "lyrics": "God bless the souls united,\nBy the bonds of sacrosanct love;\nAnd keep them from every sorrow\nIn this barren world of thorns.\nMay the home that now begins to form\nWith the union of these two hearts;\nEver enjoy a thousand blessings,\nBeneath the shelter of the God of Israel.\n\nMay the Lord with His sweet presence,\nLovingly preside over these nuptials;\nAnd lead along the paths of life\nThose who today have sworn fidelity.\nMay He remind them that naught in this world\nIs eternal, that all things must end;\nAnd therefore, with grace divine,\nThey must place their true bliss in their God.\n\nMay the two who approach the altar,\nTo pledge their faith mutually;\nEver seek from the fountain of God\nThe secret of immortal bliss.\nAnd if perchance with grief and sadness,\nTheir pathway be clouded one day;\nIn Jesus they shall find a sweet guide,\nWho will show them a better way."
  },
  "336": {
    "title": "Tarry Not, Beloved Brother",
    "lyrics": "Tarry not, beloved brother,\nNor let thy faith faint as thou wanderest;\nIf thy little bark be sinking,\nPray to Jesus and thou shalt be saved.\n\nCHORUS: He, like a beacon of light, will guide thee joyfully;\nUnto the haven where thou wouldst go, He will bring thee.\nWith Christ within thy little bark,\nHe will calm the tempest.\n\nTurn not aside, forsaking the way,\nNor yield thyself to perish now;\nIf thou seest thy hope sinking low,\nCry out to Jesus again and again.\n\nFaint not if thou art sore besieged,\nFor strength will Jesus give to thee;\nIf in great conflicts thou dost find thyself,\nTell it to Jesus and He will help thee."
  },
  "337": {
    "title": "United All, We Shall Overcome",
    "lyrics": "United all, we shall overcome,\nIf we teach what is true;\nPreaching the doctrine\n/:/ Of purity and holiness /:/\n\nIf all of us here unite,\nWe shall be able to conquer;\nPracticing that which is righteous and holy,\nAll this flock shall surely grow.\n\nIf united we all labor,\nWe shall triumph through Christ Jesus;\nDestroying the hindrances\n/:/ That hinder the way /:/\n\nIf we all do that which is just,\nWe shall be able to grow;\nLaboring for our Master,\nWe shall triumph through faith.\n\nLet us all make a new covenant,\nAs did the people of Israel;\nAnd we shall see that this Church\n/:/ Soon shall flourish /:/\n\nLet us all unite our life\nAnd our every thought;\nAll preaching one thing,\nHoliness shall surely increase."
  },
  "338": {
    "title": "This Is the Day",
    "lyrics": "This is the day of solemnity,\nLet all sing unto the Lord;\nThis is the day that is prepared,\nLet us give honor, praise, and laud.\n\nCHORUS: Glory to the Lamb who died upon the cross,\nGlory, hallelujah to the Lord Jesus;\nGlory to the Lamb for His blessing,\nHe hath wrought our redemption.\n\nThis is the day of commemoration\nOf the death of the Lord;\nA great sacrifice He suffered on the cross,\nJesus Christ, the Good Shepherd.\n\nToday we celebrate our liberty,\nAll the people of the Lord;\nGlory to the Lamb who redeemed us,\nJesus Christ, the Good Shepherd."
  },
  "339": {
    "title": "Christ Is Risen",
    "lyrics": "Christ is risen from the dead,\nAnd the grave He overcame;\nTriumphant and victorious,\nTo the heavens He ascended.\n\nCHORUS: Christ is risen now indeed,\nDestroyed hath been\nThe empire of Satan;\nThe victory\nJesus Christ hath left to us.\n\nThe empire of death,\nJesus Christ hath overcome;\nWhat a glorious story\nJesus Christ hath left to us!\n\nChrist is risen from the dead,\nWith all sovereign power;\nThe chains of death\nJesus Christ hath shattered.\n\nThe Spirit of Grace,\nWhich Jesus hath imparted unto us,\nFrom Him who is already risen\nReveals to us the victory."
  },
  "340": {
    "title": "Untiring Companions",
    "lyrics": "Untiring, O companions,\nLet us be faithful to the Lord;\nThrough Jesus we are warriors,\nWith His armour and His light,\nWe shall conquer Satan.\n\nCHORUS: I go with Jesus,\nBearing His cross;\nI leave this world,\nDevoid of light.\n\nLet us go swiftly, companions,\nLabouring without ceasing;\nFor here we are pilgrims,\nWe are messengers of God,\nThere is no rest till we arrive.\n\nIf, weary of the way,\nWe sit down to ponder;\nOthers take our seat,\nAnd upon arriving there will be no room;\nThere is no rest till we arrive.\n\nAnd arriving at the presence\nOf the glory of the Lord,\nGod shall give the fair inheritance\nUnto him that overcometh,\nThere is no rest till we arrive.\n\nLet us not forsake the way,\nFierce and heavy is the battle;\nWe are pilgrims all,\nAnd at last we shall triumph:\nThere is no rest till we arrive.\n\nAt the ending of the journey,\nFrom here unto eternity,\nGod shall give a white raiment\nUnto him that shall endure,\nWe shall arrive at home."
  },
  "341": {
    "title": "Seeking Fellowship",
    "lyrics": "Seeking fellowship we come today,\nFrom distant places with longing\nAnd with love,\nAnd we have found it\nIn Christ Who is the fountain,\nAnd gives it evermore\nTo those whom with His blood He cleansed.\n\nCHORUS: Glory to the Lamb of God\nFor His great blessing,\nThat though we were so far away\nFrom this congregation,\nThat though we were so far away,\nHe brought us into fellowship.\n\nHow good and how pleasant it is to dwell,\nBrethren in Christ in the love\nOf the Saviour from the four continents.\nChrist hath brought us\nFrom lands far away\nTo give honour and glory to the Lord.\n\nIn holy fellowship let us sing today,\nUnited in one chorus,\nA song of joy and a song of honour\nUnto Jesus,\nKing of heaven,\nEternal and mighty,\nFor in the midst of us\nThe Holy Comforter is found."
  },
  "342": {
    "title": "Temple of Our God",
    "lyrics": "Temple of... our God, my heart shall be today;\n(My heart shall be today) the sacred precinct\nIs a House of Prayer; for here the Lord\nShall command His blessing. All who desire\nTo draw near unto our God shall find Him in truth\nIn this House of Prayer.\n\nCHORUS: Let us give praises today, for the Saviour hath come,\nHe came unto every sinner to give him salvation;\nWhosoever will receive from Jesus His blessing,\nShall find Him in truth in this House of Prayer.\n\nHoly God... bless today this House of Prayer;\n(This House of Prayer) with holy fervour,\nWe beseech Thee, O Lord, that Thou receive from this Church\nHer fervent prayer; unto the throne of Thy grace\nShall the petition come, of those who worship Thee today in truth,\nIn this House of Prayer.\n\nBlessing... the Lord giveth in this House of Prayer;\n(In this House of Prayer) ye holy tribes, march on\nToward that holy Zion; praise and exalt\nThe Name of our God, for there is peace and gladness\nIn every heart that worshippeth in truth,\nIn this House of Prayer."
  },
  "343": {
    "title": "I Love the Name of God",
    "lyrics": "I love the Name of God, I love the Sublime One;\nI love the Lord who gave my salvation;\nI love the mighty and holy hand, which to dry my tears\nHastens swiftly.\n\nCHORUS: The arms whereon I\nLay down my burden,\nWhich unto my toils\nServe as a comfort;\nThey are unto me\nAll my glory;\nTherefore thus I sing,\nThat Christ hath saved me.\n\nWhen I wandered hopeless, with sinful deeds\nI stained my soul; Thy grace alone,\nBosom of tenderness, the dark sins\nTook away from my soul.\n\nI love the Name of God amid my struggles,\nFor faith shall triumph in affliction;\nWherefore unto Him I will give the glory,\nBecause my weapon is prayer.\n\nHe loveth me too, I know, I understand it;\nLife He granted me through His pain;\nI lay down all my sorrows, and His holy hand\nShall bless me."
  },
  "344": {
    "title": "I Have a Shepherd",
    "lyrics": "I have a Shepherd,\nWho from the soul chaseth sorrow away;\nI have a Shepherd,\nWhose Name is without equal;\nI have a Shepherd,\nWho imparteth His comfort to me,\nSeeing me alone in my struggles\nAgainst evil.\n\nCHORUS: I have a Shepherd, a loving Shepherd,\nMy tender Shepherd is Christ.\n\nI have a Shepherd,\nWho網絡stilleth the tempests;\nI have a Shepherd, who calmeth the troubled sea;\nI have a Shepherd,\nWho healeth me body and soul,\nAnd tenderly\nAllayeth my pain.\n\nI have a Shepherd,\nWho defeateth the enemy;\nI have a Shepherd,\nWho giveth victory and triumph;\nI have a Shepherd,\nWho goeth with me everywhere,\nAnd in the battle\nIs ever at my side.\n\nI have a Shepherd,\nWhose Name is Wonderful;\nI have a Shepherd,\nRich gift of the God of love;\nMy Good Shepherd,\nAbove all is Wonderful;\nSupreme King is Jesus,\nMy good Lord."
  },
  "345": {
    "title": "Jehovah Is My God",
    "lyrics": "Jehovah is my God, in Him will I trust,\nAnd my Helper, through Him shall I overcome;\nI will follow the path of Jesus Christ,\nI desire to see Him where He is.\n\nCHORUS: He marked for me the path, the good way,\nAnd a pilgrim I must be;\nArriving in the presence\nOf the divine King,\nI shall see His face even as He is.\n\nIf Thou help me, O God, King of Israel,\nAs He helped His servant Moses,\nWhen he went forth from Egypt through the wilderness,\nJourneying as a pilgrim with Israel.\n\nI also came forth from the fierce world,\nWhich is worse than Pharaoh's Egypt,\nWhere my soul, sorrowful and weary,\nWas being lost from salvation.\n\nI behold by faith that city\nWhich my Jesus Christ went to prepare,\nWhere my sufferings and afflictions\nWith Jesus Christ shall end."
  },
  "346": {
    "title": "We Are One Flock in Christ",
    "lyrics": "We are one flock in Christ,\nAnd the Lord is the Shepherd;\nHe filleth us with His grace,\nAnd poureth out His holy love.\n\nCHORUS: All filled with fervour,\nLet us labour with love;\nIn this precious work,\nThe Lord shall give us strength.\n\nThe work that is now done,\nThe Lord shall reward;\nThe crown of righteousness as a prize\nHe shall give unto us.\n\nIf we have not the means,\nJesus Christ shall provide;\nThat the work may continue\nEach day in prosperity.\n\nFrom troublesome men,\nChrist shall defend us;\nFrom the throne of His grace,\nHe shall send His holy angel."
  },
  "347": {
    "title": "The Church Rejoiceth",
    "lyrics": "/:/ The Church rejoiceth /:/ in the midst of sorrow,\nThough in the midst of trials and of tribulations,\nShe rejoiceth in the Lord. /:/ The Church rejoiceth /:/\nAnd singeth with fervour unto Him who shepherdeth her,\nIn the midst of the desert, Jesus the Good Shepherd.\n\nCHORUS: Oh, how good is my Lord!\nOh, how sweet is my Shepherd!\nI feel consolation in my soul;\nBlessed be the Lamb,\nJesus Christ the Good Shepherd.\n\n/:/ If trials come, /:/ then I will endure them;\nJesus Christ is with me, He is my strength,\nIn Him will I hope. /:/ If more trials come, /:/\nThen I will endure them; in Christ have I trusted,\nAnd Thou art ever at my side, with Him I will not fear.\n\n/:/ The Church is glad /:/ in tribulation,\nThough sorrowful and afflicted, yet never overcome,\nShe rejoiceth in the Lord. Poor and weary,\nYet not forsaken, for she hath her Lord,\nWho ever blesseth her, and also\nComforteth her through the Comforter."
  },
  "348": {
    "title": "Why Should I Sin If I Am Saved",
    "lyrics": "Why should I sin if I am saved,\nIf now I have holy light?\nWhy should I sin if life\nGod hath given me in Jesus?\nWhy should I sin if hell\nOnly awaiteth the sinner?\n/:/ Why should I sin /:/\nAgainst God?\n\nIt is better to live holily,\nVictorious against evil;\nFor Jesus prepareth for His saints\nA heavenly Homeland;\nA fair Homeland in the heavens,\nWhere the world shall not enter;\n/:/ Why should I sin /:/\nAgainst God?\n\nWith Jesus the King we shall arrive\nAt the Heavenly Homeland;\nIn everlasting peace we shall dwell,\nEnjoying His lovingkindness,\nWhere there shall be no more sorrow,\nNor cares, nor pain;\n/:/ Why should I sin /:/\nAgainst God?\n\nWhy should I sin if the sinner\nTurneth us away from love?\nWhy should I sin if I am born\nNow anew in the Lord?\nWhy should I sin if in the world\nOnly perdition is found?\n/:/ Why should I sin /:/\nAgainst God?"
  },
  "349": {
    "title": "There Shone Thy Light",
    "lyrics": "There shone Thy light,\nDying upon a cross;\nThere Thou expiredst upon it,\nThou didst save my soul.\n\nCHORUS: I feel myself set free,\nSince that I was washed\nIn Thy blood, faithful Lamb;\nWith the Holy Spirit\nI have also been sealed.\n\nThou didst suffer for me,\nFor me Thou drankest gall;\nToday I suffer for Thee,\nI desire to be faithful to Thee.\n\nVery easy is Thy yoke,\nThy burden is very light;\nMake me meek and lowly,\nThat my soul may not be lost.\n\nDivine Saviour,\nGrant unto me charity;\nThat I may love Thee\nIn all liberty."
  },
  "350": {
    "title": "This I Have Against Thee",
    "lyrics": "This I have against thee,\nSaith the Lord Jesus:\n/:/ That thou hast forsaken Me,\nAnd cast away My love. /:/\n\nCHORUS: The Lord calleth thee today,\nDespise not His goodness;\nIf thou hast lost love,\nToday thou canst find it.\n\nRemember from whence thou art fallen,\nAnd return to thy former way;\n/:/ Thou must repent\nThat thou mayest reign with Him. /:/\n\nObedience and humility\nIs My demand of thee;\n/:/ That thou mayest enter\nInto the kingdom I promised. /:/\n\nTwo ways there are;\nExamine which one thou walkest;\n/:/ Two rewards await thee;\nSay today: Which wilt thou await? /:/"
  },
  "351": {
    "title": "What Sweet Repose!",
    "lyrics": "What sweet repose\nThe Christian findeth,\nIn the holy arms\nOf the Crucified!\n\nCHORUS: All is joy,\nStruggles are forgotten,\nAbiding with Christ,\nThe God of life;\nThe comfort of the soul\nIs the holy Lord,\nWho brought peace\nUnto my heart.\n\nWhat sweet rest\nThe believer receiveth,\nKeeping the laws\nOf the Omnipotent!\n\nWhat sweet comfort\nIs felt with Christ!\nHis love is tenderness,\nHis love is blessed."
  },
  "352": {
    "title": "How Sweet Is Thy Name",
    "lyrics": "How sweet is Thy Name, O Jesus!\nCalm hast Thou placed within my heart;\nThy death on the cross brought me salvation,\nBy faith I walk in Thy light.\nMy griefs Thou didst cast into the deep,\nNevermore didst Thou remember them;\nThy blood cleansed me from all iniquity,\nAnd established in me Thy truth.\n\nHow sweet is Thy Name, O Jesus!\nThou hadst compassion upon my soul;\nThou didst fill all my heart with health,\nBy Thy mercy and virtue.\nA song of grace I feel within my being,\nThy path is unto me a delight;\nMine eyes lifted toward heaven can see\nThe glory of Thy great power.\n\nHow sweet is Thy Name, O Jesus!\nEternal shall be the joy in Thy mansion;\nAbodes of great gladness and fullest light,\nThere shall be no more tribulation.\nThrough Thy mercy make me to know\nThy will, that I may flourish;\nAccording to Thy promise I know Thou shalt return,\nWherefore suffer me not to fall."
  },
  "353": {
    "title": "Shall We Overcome? Yes, We Shall Overcome",
    "lyrics": "Shall we overcome? Yes, we shall overcome,\nAnd we shall reach that happy home;\nSoon cometh my Jesus Christ,\nTo bear us away to rest.\n\nCHORUS: Millions are the warriors of the King,\nWho resolute go forth\nFollowing after Him,\nBearing on high\nThe banner of holiness,\nAnd Jesus Christ shall give them victory.\n\nShall we fight? Yes, we shall fight\nThe battle of faith in Jesus;\nAnd triumphant we shall praise\nThe Lamb who died upon the cross.\n\nThough other peoples believe in the stars\nAs gods that are able to save,\nYet we in Jesus Christ\nThe battle surely shall win.\n\nThey go girt with the truth,\nPreaching Him who died on the cross;\nIn their hand they bear the sword\nAnd the shield of faith in Jesus."
  },
  "354": {
    "title": "The Call",
    "lyrics": "Who will go to labour in the fields?\nFor the Master soon shall return;\nWho will listen to the calling:\n\"Preach ye this message of mine\"?\n\nCHORUS: Here am I, send me;\nGrant me all Thy power;\nI will bear the faithful message;\nMy Lord, I will go, I will go.\n\nSouls that are wandering\nIn the dreadful world of sin;\nWho will listen to the calling\nOf him that groaneth in darkness?\n\nAwake, for the harvest is passing,\nAnd with it the opportunity;\nGather in the white sheaves,\nFor the faithful Master shall reward us."
  },
  "355": {
    "title": "Temptations Arise",
    "lyrics": "Temptations\nArise on every hand;\nThey seek to make us\nFall into error;\nYet trusting in Christ,\nWe shall have the victory,\nAnd we shall see the enemy perish.\n\nCHORUS: For we know that here we have\nA faithful Captain and Saviour;\nIt is Jesus Christ the great Lord,\nHe who overcame the tempter.\n\nGod is my shield, and in Him\nWill I trust;\nTemptations through Him\nWill I overcome;\nThrough Jesus Christ I shall have victory;\nAfterward in glory,\nWith joy will I sing.\n\nMighty God, be Thou my Helper,\nAll Thy people hope in Thy power;\nI also hope to have victory in Thee;\nIf Thou help me, I also shall overcome.\n\nThe hosts are prepared,\nThey have faith, hope, and charity,\nTo arrive triumphant in Glory,\nWhere for ages with Christ they shall dwell."
  },
  "356": {
    "title": "Sin Is the Enemy",
    "lyrics": "Sin is an enemy\nIn the sheepfold of Jehovah;\nOur warfare is to cast it out\nWith the spiritual sword.\nToday we shall win confidence,\nOvercoming evil with good;\nWithout fainting we will fight,\nFor this Christ the King desireth.\n\nCHORUS: Stand ye in the ways,\nSaid a servant of Jehovah;\nChoose ye the good way,\nThat ye may find rest.\nBehold, \"I am the way,\nI am the life and the truth,\"\nFrom the divine Lamb;\nBlessed be His great goodness.\n\nFight on, valiant soldier,\nEquipped with charity;\nFor our Captain hath triumphed,\nAnd thou shalt triumph too.\nHe hath overcome death,\nThou also shalt overcome it;\nAnd thou shalt rejoice forever,\nIf thou look not back.\n\nIn Jesus is the warfare,\nThe refreshing of love;\nWhosoever trusteth in Him\nShall see perdition no more.\nRather, his joy shall be,\nHolding faithful fellowship\nWith the Lion of Judah,\nYonder in the Holy City."
  },
  "357": {
    "title": "At Times the Wind Bloweth",
    "lyrics": "At times the wind bloweth,\nSeeking to tear away\nThe wheat from the wheatfield,\nFrom the chief Cornerstone.\n\nCHORUS: The wheat never bloweth away,\nA steadfast seed it is;\nThe chaff is that which flieth,\nAnd in the furnace is burned.\n\nAt times cometh the wind\nWith fury and tempest,\nSeeking to tear away\nThe truth from the soul.\n\nBrother, I counsel thee,\nForsake all vanity;\nBe humble before my Lord,\nStrive earnestly in truth.\n\nThy grain is secure\nWithin the storehouse;\nFor Christ is our shield,\nHe careth for thee and me."
  },
  "358": {
    "title": "Though in This Life I Have No Riches",
    "lyrics": "Though in this life I have no riches,\nI know that yonder in glory I have a mansion;\nAs a lost soul amid poverty,\nUpon me Jesus Christ had compassion.\n\nCHORUS: /:/ Beyond the sun, beyond the sun,\nI have a home, home, beauteous home,\nBeyond the sun /:/\n\nAnd if through the world I am walking,\nSurrounded by trials and temptation,\nYet Jesus Christ, who goeth guiding me,\nShall bring me safe unto His mansion.\n\nUnto all the races of human kind\nChrist offereth full salvation;\nAlso a house not made with hands\nHe went to prepare for us there in His mansion."
  },
  "359": {
    "title": "Jerusalem",
    "lyrics": "Jerusalem, city of God,\nBeauteous home full of love;\nGlorious Eden full of peace,\nFull of light and a thousand glories;\nIt shall descend from God on high\nAs a bride adorned in truth.\n\nAn unshakeable building\nIs the city of our King;\nPrecious stones of jasper they are,\nResplendent even as crystal;\nTwelve are the gates that stand open,\nAnd twelve angels guarding their entry.\n\nTo dwell yonder shall be a delight,\nHaving God for our King;\nLiving in peace, where nevermore\nShall death be able to enter;\nNo more shall be weeping, crying, nor pain,\nChrist Jesus shall be our all in all.\n\nThe brightness and light of God abideth in thee in\nFullness to shine eternally, day and\nNight without ceasing; neither sun nor moon shall\nGive us light, Christ the Lamb shall be the light thereof.\n\nJerusalem, city of God,\nWithin thee holiness abideth,\nFor he that doeth evil shall not enter,\nNor he that speaketh lies or falsehood,\nOnly he that worketh righteousness and truth,\nAnd is found written in the book of God."
  },
  "360": {
    "title": "Pray, Faithful Brethren",
    "lyrics": "Pray, ye faithful brethren,\nLet us press on in the strife,\nLet us go forth to the fields to sow the truth,\nTo seek after new souls,\nThat they may humble themselves to Christ,\nAnd draw them from the mire of the world of sin.\n\nCHORUS: Lift up, lift up, lift up your banner,\nYe are witnesses of His great power,\nAnother year of toil doubtless awaits us,\nThe cross of Jesus Christ let us bear everywhere.\n\nYe know how much is suffered, ye know how much is wept,\nYet duty calleth, go ye forth to labor;\nSouls cannot wait, they perish in their sin,\nThey await relief from their eternal weeping.\n\nLet us sow the seed, let us sow it everywhere,\nPerchance it findeth ground where it may spring forth;\nWe know that he is nothing\nWho planteth or who watereth,\nSave the divine God, who maketh it to grow.\n\nThe prize awaits us, let us strive with diligence,\nThe day draweth near, the fig tree now shooteth forth,\nThe cry of the peoples is heard everywhere,\nAnd the nations with longing seek the life beyond.\n\nWith great rejoicing united have we stood,\nTogether we rejoiced, all in sweet fellowship,\nAnd thus all of His blessings we received,\nYet duty leadeth us to fulfill our\nMission."
  },
  "361": {
    "title": "The World to Me",
    "lyrics": "The world to me is not a home,\nMy home is with God;\nHere am I a pilgrim,\nFleeing from evil;\nTherefore the world loveth me not,\nBecause I am not of it.\n\nCHORUS: /:/ My home is with God\nIn holy Jerusalem /:/\n\nThe world to me is no delight,\nMy glory is with God,\nAnd to be prostrate at His feet\nAnd hear Him speak,\nWords that give unto me life\nAnd eternal salvation.\n\nThe world of evil shall pass away,\nMy Christ hath spoken so;\nYet they that believe in my Christ\nShall abide singing\nWith gladness to the great heavenly King."
  },
  "362": {
    "title": "The Time Is at Hand",
    "lyrics": "The time is at hand,\nThe word of God\nIs fulfilling even now;\nWander not astray,\nFor loving Christ\nIs calling, waiting still.\n\nCHORUS: Today is thy day of salvation;\nThe accepted time of grace;\nTarry not, lost soul, come unto Jesus,\nFor He will give thee His pardon.\n\nIf thy life be bitter,\nAnd heavy thy load,\nWith none to help thee;\nHearken unto Jesus Christ,\nGraciously He calleth thee:\nCome, come, I will give thee rest.\n\nMake no excuses,\nNor deceive thine own soul,\nSaying: \"Ah, it shall be another time,\"\nFor thou knowest\nNeither the day nor the hour\nTo stand before the righteous Judge."
  },
  "363": {
    "title": "If Thou Hast Sinned",
    "lyrics": "If thou hast sinned, thy heart chargeth thee,\nAnd if thou hide it, thou shalt not prosper;\nYet tell it to Christ and His tender mercy,\nFrom the hand of God, thou shalt obtain pardon.\n\nCHORUS: The Word of my God is like unto a sword\nThat pierceth deep into the heart;\nFor it, thou must leave an open doorway,\nIt searcheth the intent of thy soul.\nNever despise the Word of Christ,\nFor it shall be thy sure defence.\n\nIf thou hast sinned, thy conscience accuseth thee,\nAnd if thou cover it, thou shalt not prosper;\nRead in Proverbs, chapter twenty-eight,\nAnd verse thirteen shall declare it unto thee.\n\nEvery word of God is sharp and piercing,\nHe beholdeth the depths of thy heart;\nIf thou hast sinned, confess it this instant,\nIf thou turn from evil, He will grant thee pardon.\n\nFor faithful is Christ, for He hath promised\nThat from His hand thou shalt obtain pardon;\nIf in thy frailties thou feelest helpless,\nAsk evermore of Him His protection."
  },
  "364": {
    "title": "Wouldst Thou Know Why I Sing So Joyfully?",
    "lyrics": "364 Wouldst Thou Know Why I Sing So Joyfully?\n\nWouldst thou know why I sing so joyful,\nLike the bird that blesseth its Creator,\nIn the meadow and the delightful forest?\nBecause God forgave me in His sweet love.\n\nCHORUS: Hallelujah! Hallelujah!\nAll my guilt the Redeemer hath forgiven;\nHow glorious is my Christ;\nIn my soul I have the joy of His love!\n\nWouldst thou know why I live so trustingly,\nThough the tempest roar round about me?\nThe Lord Jesus is ever by my side,\nHis presence giveth me peace and assurance.\n\nWouldst thou know why I live set apart\nFrom the fountain of worldly delights?\nJesus Christ by His death hath saved me,\nAnd in Him I find peace, heavenly delight."
  },
  "365": {
    "title": "If My People Shall Humble Themselves",
    "lyrics": "If My people shall humble themselves,\nSaith the Lord JEHOVAH;\nUpon whom My Name\nIs called,\nI will fill them with power\nAnd spiritual courage;\nI will raise them up with glory\nAnd grant unto them the final triumph.\n\nCHORUS: Seek ye God,\nWhile He may be found;\nCall ye upon God,\nWhile He is near;\nSeek Him with diligence,\nCall upon Him with love,\nUnto the King of the heavens,\nWho is the Victor.\n\nIf ye shall seek Me in truth\nWith all your heart,\nI will give answer unto your petitions;\nI will fill with strength\nEvery heart;\nAnd I will be unto them a guide,\nSaith the Lord, the God of Israel.\n\nGod hath revealed Himself to His people\nWith signs beyond compare,\nAnd He hath set within their souls\nA new name;\nThe earnest of redemption\nUnto the day of His Coming,\nWherewith He sealed\nAll of His flock in the heart."
  },
  "366": {
    "title": "The Peace of Christ the Lord",
    "lyrics": "The peace of Christ the Lord\nDwelleth in the heart\nOf this Church of the King,\nWhich He purchased with His blood\nThat He poured out.\n\nCHORUS: Acclaim, all with one voice,\nSalvation unto our King;\nSalvation and praise to the Lamb,\nStrength and dominion\nBe forever and ever. Amen.\n\nChurch of the Truth,\nSing ye, sing unto the King;\nUnto the King of all power,\nWho hath forever given\nLiberty.\n\nChurch of King Jesus,\nPillar of the Truth;\nLet us walk in holiness,\nThat we may arrive triumphant\nWith the Lord.\n\nWith joy let all of us here\nGive glory unto the King;\nUnited in love,\nRendering hallelujahs and praises\nUnto the Lord."
  },
  "367": {
    "title": "Christ, the Savior of Israel",
    "lyrics": "Christ, the Savior of Israel,\nMade His dwelling within my soul,\nWherefore I sing even so:\nHallelujah! Amen.\n\nCHORUS: Hallelujah! Amen,\nHallelujah! Amen,\nUnto Jesus Christ the King,\nHallelujah! Amen.\n\nHoly is the Lamb, Emmanuel,\nHe blotteth from the soul all sin;\nLet us all say unto Him:\nHallelujah! Amen.\n\nYe servants at the altar of the LORD,\nWho stand there night by night;\nLet us sing to the righteous Judge:\nHallelujah! Amen.\n\nThou wert merciful to my groaning,\nMy soul was ready to perish;\nWherefore ever will I say:\nHallelujah! Amen."
  },
  "368": {
    "title": "Pray and Pray Yet More",
    "lyrics": "There is one thing important in this life,\nMost needful that thou mayest prevail;\nFar better than riches and meat,\nThou shalt find that more sublime it is to pray.\n\nCHORUS: To pray and to pray and pray yet more,\nTo pray and to pray and ever pray,\nTo pray that thou mayest prevail,\n/:/ And pray yet more /:/\n\nWhen I am found on my knees before Christ,\nAt morning when I stand before the altar;\nWhen tears bedew my cheeks,\nI behold the peace of Jesus Christ in prayer.\n\nAn experience, brother, I would have thee know:\nChrist biddeth thee draw near unto the altar;\nThou shalt find all things that thou askest of Him,\nThou shalt discover how needful is prayer."
  },
  "369": {
    "title": "The Master Is Risen",
    "lyrics": "The Master is risen,\nAnd among us He standeth;\nPromptly He gave Himself to die,\nAnd now is He risen indeed.\n\nCHORUS: He is risen, He conquered death,\nThe King, almighty and strong;\nHe overcame, He overcame!\nThe Lamb of God.\n\nUnto the heavens He hath ascended,\nAnd in the heavens He dwelleth;\nAt the right hand of Him who liveth,\nUnto all eternity.\n\nJesus Christ hath promised,\nHis promises He will fulfill,\nUnto him that hath believed on His name,\nTo come and raise him up.\n\nIn the heavens we shall be,\nWhere the Great Master is;\nAnd with Christ we shall rejoice,\nUnto all eternity."
  },
  "370": {
    "title": "How Beautiful Is the Story",
    "lyrics": "How beautiful is the story\nOf Christ, the Good Shepherd;\nHe came down from His exalted glory\nAnd sought me with tender love.\n\nCHORUS: He sought me, He sought me,\nWhen a wandering sheep was I;\nHe found me, He found me;\nO happy day for me!\n\nHe found me at a great distance\nFrom the Heavenly Kingdom;\nAnd beholding my great misery,\nHe delivered me from so great an evil.\n\nSins weighed heavily upon me,\nAnd sorrowful was I;\nNow my lips sing forth\nPraises to Him who saved me.\n\nHis footsteps now I follow,\nBy grace and through faith;\nThere is in the world no other friend\nWho equaleth the One I found.\n\nO wandering sinner!\nFar off from the Shepherd;\nHearken today to His loving voice,\nCalling thee with tender love."
  },
  "371": {
    "title": "O JEHOVAH! Hearken to My Words",
    "lyrics": "O JEHOVAH! Hearken to my words,\nConsider my meditation;\nAttend unto the voice of my soul,\nBe merciful unto this my prayer.\n\nCHORUS: Grieved am I to have offended Thee,\nAnd I purpose nevermore to sin;\nWithout Thee I feel lost and undone,\nCome, comfort me, O God of goodness!\n\nI was wandering lost in the world,\nNot knowing whom I might consult;\nNow I feel a sorrow in my soul,\nMy conscience is ready to condemn me.\n\nMy sin is ever before me,\nFrom my mind I cannot erase it;\nOnly Christ, who was without sin,\nWith His blood could wash it away.\n\nI know that Thou art a God of clemency,\nWho grantest forgiveness unto all;\nGrant me, O God, of Thy grace and power,\nThat I may lay hold on salvation."
  },
  "372": {
    "title": "The Times Are Come",
    "lyrics": "The times are come,\nThe days are fulfilled\nOf those prophecies\nWhich the Lord did speak,\nWhen He went from the temple\nUnto the Mount of Olives,\nAnd with living words\nLeft us the signs.\n\nCHORUS: When He went from the temple\nUnto the Mount of Olives,\nAnd with living words\nLeft us the signs.\n\nToday we see the times\nSwiftly passing by,\nShowing forth signs\nThat the Lord shall come.\nHe speaketh by wars,\nHe speaketh by winds,\nThat the time draweth near\nWhen Christ shall return.\n\nNow all is fulfilled,\nThere is naught left to await;\nIf any man be asleep,\nNow may he awake.\nIn Him shall we find\nRelief and faithful comfort;\nThe King of Heaven cometh\nTo lift up His Church.\n\nWhy then should thy sins\nNot be borne by Christ,\nSeeing He hath saved us\nBy His death on the cross?\nHe is thine Advocate,\nHe is thine Intercessor;\nHe desireth to redeem us\nIn token of His love."
  },
  "373": {
    "title": "I Will Sing, I Will Sing Unto Jesus",
    "lyrics": "I will sing, I will sing unto Jesus,\nI will declare that I am glad\nIn His light;\nWith love, with fervor,\nI will serve my King and Lord\nUnto all eternity.\n\nCHORUS: I will sing... Unto Jesus, my Lord,\nI will declare... With all of my heart;\nThe LORD liveth, my Deliverer,\nUnto all eternity.\n\nLike a flower that sheddeth its fragrance,\nAnd that breatheth forth its sweet\nPerfumes of love;\nEven so shall my song be today,\nPerfuming the throne of God\nUnto all eternity.\n\nMy prayer and my sweet\nSong, shall unite with the joyful celestial choir,\nTo give praise\nUnto Him who reigneth forever and ever;\nBlessing be unto Him."
  },
  "374": {
    "title": "Gird Thy Sword Upon Thy Thigh",
    "lyrics": "Gird thy sword upon thy thigh,\nO youth of Israel!\nDefend with haste the cause\nOf the gospel of peace;\nFor in the lead goeth thy Captain,\nHe is the Lamb of God.\n\nCHORUS: Hallelujah!... Hallelujah!\nHallelujah unto our God!\nBlessed be Jesus Christ,\nWho vanquished the enemy;\nFear not, gird on thy sword,\nSoon shall we overcome.\n\nWith the two-edged sword\nWe shall vanquish the dragon;\nBruising his head\nIn the Name of the Lord;\nHe will give us the victory,\nGlory, Hallelujah to the Lord!\n\nFaithful Bride of the Lamb,\nWatch evermore in prayer;\nAwaiting the coming\nOf Jesus Christ the Lord;\nSleep not, gird on thy sword,\nSmite the infernal dragon."
  },
  "375": {
    "title": "Today We Praise Thee, Lord of Heaven",
    "lyrics": "Today we praise Thee, Lord of heaven,\nOn this our day of liberty;\nFrom being captives bound in sin,\nToday we taste of liberty.\n\nCHORUS: Blessed fold of Christ Jesus,\nWherein we serve our God,\nThe God of the heavens,\nThrough Christ the Redeemer.\nHaving been lost,\nFar off from the Lord,\nToday we serve Him\nWith all of our heart.\n\nAll of this people now standeth free,\nBecause Thy hand hath delivered them;\nNow their rejoicing is to bless Thee,\nO God of heaven, for Thy goodness.\n\nThose who lead this flock,\nThou dost instruct them, Lord JEHOVAH;\nAnd Thy holy hand guideth them,\nAnd we serve Thee in holiness.\n\nThrough Jesus Christ, Lord of heaven,\nWe present ourselves before Thine altar,\nTo offer unto Thee our praise,\nGod of the heavens, Lord Jesus."
  },
  "376": {
    "title": "Joy",
    "lyrics": "Joy alone in Jesus is found,\nUnspeakable joy that He alone can give,\nJoy, love, and peace,\nJoy that overfloweth my life.\n\nCHORUS: Jesus alone could give to me\nThis boundless joy unto my soul,\nAnd I am glad in my Jesus.\n\nLife alone in Jesus is found,\nAn unsearchable fountain is the Lamb of God;\nLife, peace, and quiet rest,\nLife in Christ our King.\n\nChrist, He is love and peace,\nHe hath compassion on him who erreth and strayeth,\nChrist, Christ the Lord,\nHe is the life eternal.\n\nI sing, I sing unto Jesus my King,\nWith great joy within my heart;\nI sing, I sing unto Jesus,\nFor He is all in all to me."
  },
  "377": {
    "title": "Servants of Jesus, Men of Truth",
    "lyrics": "Servants of Jesus, men of truth,\nKeepers of duty, yea, are we;\nFreed from wickedness, rich in goodness,\nAnd faithful will we be unto the fray.\n\nCHORUS: Firm and strong, lift up the banner,\nGreat and noble emblem of love;\nSwiftly, swiftly go we everywhere,\nMarch on, all, we shall overcome!\n\nHow beautiful are they! who without fear,\nReady at the calling of the Lord,\nStrive without ceasing, suffer without doubting,\nKeepers of duty with great love.\n\nOur Captain is already victor,\nHe redeemed us by His cross;\nKeepers of duty, He giveth us power,\nAnd He will keep us in His holy light.\n\nInvincible are they who without fret,\nDaily go forth unto duty;\nGlory and light shall they have and receive,\nA great reward among the flock."
  },
  "378": {
    "title": "In the Early Hours of the Sweet Morning",
    "lyrics": "In the early hours of the sweet morning,\nThe flowers perfume Thy throne, O God!\nAnd the prayers of the people who love Thee,\nAnd songs of glory, proclaim Thy love.\n\nCHORUS: Christians likewise adore Thee,\nEven Thee, the Sovereign King;\nUnto Thee they sing of victory\nBecause of Thy power;\nUnto Thee, most excellent King,\nUnto Thee, God of Israel.\n\nIn the early hours of the sweet morning,\nThe glad soul praiseth the Creator;\nIts rich perfumes and sweet ointments\nAre the prayers and the sweet song.\n\nI laid me down and slept, and I awaked,\nFor the hand of God sustained me;\nTherefore with gladness I bless this day,\nThe blessed Name of the Redeemer.\n\nBlessed be the Name of Christ Jesus,\nWho reacheth forth His hand and giveth protection;\nHe who with His right hand upholdeth souls,\nWherefore unto His Name we render praise."
  },
  "379": {
    "title": "A Life of Peace I Found With My King",
    "lyrics": "A life of peace I found with my King,\nMy heart understood holiness,\nWhen in His love He brought me to His fold,\nThe beloved Christ, the God of Truth.\n\nCHORUS: Blessed Lord!\nI am joyful in Thy love;\nI bear Thee in my soul,\nThou givest me sweet calm, blessed Lord!\n\nI knew not the tenderness and peace\nWhich glorious Jesus alone doth possess,\nFor the sons of men who forsake evil,\nLeaving their errors, coming to His light.\n\nI sing unto Him whose right hand holdeth power,\nUnto Him who brought my soul out of wickedness;\nI desire to dwell forever with Him\nIn the mansions that He went to prepare.\n\nHoly Maker of the heavens and the sea,\nThou who didst form the earth and all therein,\nMake of my soul a sweet altar\nWhere Thou mayest dwell forever and ever."
  },
  "380": {
    "title": "There Is a Matchless Treasure",
    "lyrics": "There is a matchless treasure\nYonder in heaven,\nWhich the sinner\nHath ever longed to obtain;\nAnd walking onward\nAmong thorns and briers,\nRich treasure which one day, we shall attain.\n\nCHORUS: Though there be a fierce tempest in my\nPathway,\nWhich smiteth my soul with cruelty,\nYet eagerly I look to see the Rainbow\nProclaiming forever blessed peace.\n\n'Tis a most precious palace that I seek,\nAnd 'tis hidden behind the turquoise mantle,\nAnd 'tis adorned with beauteous stars;\nIt is a treasure that I seek for mine own.\n\n'Tis a precious Prince who dwelleth there,\nAnd with longing I desire to know Him,\nFor I was purchased at the price of His blood,\nAnd my life He changed by His power.\n\nHe is so good, so gracious, and so loving,\nThat in my trials He imparteth His power to me;\nAnd He cheereth and helpeth me on my way,\nThat evermore I may live with Him."
  },
  "381": {
    "title": "Today We Long to Feel the Presence of God",
    "lyrics": "Today we long to feel\nThe presence of God,\nAnd enjoy the communion\nOf the Holy Comforter;\nOh yes, how wondrous 'tis to feel\nThe presence of God!\n\nCHORUS: At the presence of the Lord\nTremble the heavens, earth, and sea;\nLikewise the souls that He hath bought\nTremble with spiritual joy.\n\nYea, the Holy Spirit\nAmong us this day,\nDwelleth in every heart\nOf the souls that He hath bought;\nHonor and glory, voice of praise,\nThey shall render to the Lord.\n\nHoly Comforter,\nGod of love and truth,\nThou art come unto Thy flock\nTo give joy and liberty;\nOh, hallelujah, glory to God\nFor His wondrous goodness!"
  },
  "382": {
    "title": "From Lands Afar We Come With Joy",
    "lyrics": "From lands afar\nToday we come with joy,\nTo sing a song\nAmong the redeemed;\nSaints who are washed\nIn the precious blood of the Lord.\n\nCHORUS: Thanksgiving,\nPower and virtue\nUnto the Lamb of God;\nJoyfully singeth\nThis multitude,\nFor His great majesty,\nUnto Him be all blessing.\n\nOh, how marvelous\nAre the works Thou hast wrought,\nDivine Redeemer!\nOh, how unsearchable\nAre all Thy judgments,\nThy excellence is great, O Lord!\n\nUnto Thee we will sing\nOur songs, with joy,\nHoly Comforter;\nBlessed forevermore\nBe Thou, O Lamb,\nTo Thee we give the glory and the honor."
  },
  "383": {
    "title": "Ye Are the Temple of God",
    "lyrics": "Ye are the temple of God,\nYe who worship God;\nIn this His house of prayer,\nUnited with fervor,\nYe render praise to Him.\n\nCHORUS: House of God,\nBless ye the Lord;\nO people of Israel,\nBless ye your King!\nSay ye with joy:\nLong live Christ the King!\n\nYe are the temple of God,\nYe who serve God;\nWith a pure heart,\nFree from iniquity,\nYe consecrate yourselves to God.\n\nYe are the house of God,\nIf ye hold fast from God,\nHis sweet Word of Truth\nWithin your heart,\nAnd walk in His Law."
  },
  "384": {
    "title": "We Have Need of Christ",
    "lyrics": "We have need,\nOf Christ the Saviour;\nFor with Him we have\nBoth peace and love;\nForever blessed be\nJesus, my Redeemer.\n\nCHORUS: O Christ, all souls have\nNeed of Thee;\nFor Thou dost uphold them,\nAnd they are saved by Thee.\n\nAs a thirsty land,\nAs a parched wilderness,\nSo before Thee appear\nThe souls more and more;\nFor Thou dost nourish them\nWith Thy great goodness.\n\nTo Thee, Creator of Heaven,\nTo Thee, Heavenly King,\nWe ask for the comfort,\nThe Spiritual Manna;\nThou carest for Thy servants,\nThy blessing Thou dost give them."
  },
  "385": {
    "title": "Now the Morning Hath Come",
    "lyrics": "Now the morning hath come,\nThe day brightly shineth\nWith its radiance;\nThe night is now past,\nAnd all its weariness,\nWe ought to awake.\n\nCHORUS: Come, let us sing,\nFor the day hath shone forth;\nThe light of God\nWhich brought salvation.\n\nNow the morning hath come,\nThe night is now past\nAnd the darkness;\nLet us cast off the works\nThat belong to darkness,\nLet us follow the Truth.\n\nThe light of Jesus Christ\nHath shined upon us\nIn our heart;\nLet us lay aside strife\nAnd every grievance,\nLet us follow the Lord."
  },
  "386": {
    "title": "Beloved of the Lord",
    "lyrics": "Beloved of the Lord, thy Beloved loveth thee,\nAnd His delight is only in thee;\nSeek thou thy Beloved,\nEven as thy Beloved seeketh thee,\nAnd thou shalt live with Him\nWhen He cometh for thee.\n\nCHORUS: Faint not, beloved of the Lord,\nSeek thy Beloved with all thine heart;\nFor thy Beloved\nHath promised to return,\nTo take thee to His mansion.\n\nChurch of the Lord,\nO blessed art thou,\nFor Christ hath already sealed thee;\nHe named thee\nHis own beloved Bride,\nFor His glory, He created thee.\n\nThe blessedness thou hast attained,\nO beloved Church,\nTo be called unto God;\nTherefore they call thee\nThe blessed one,\nFor with His blood He purchased thee."
  },
  "387": {
    "title": "Be Valiant unto the Battle",
    "lyrics": "Be strong, valiant one, unto the battle,\nFight faithfully without fainting for the truth;\nGo telling the nations\nThat in Jesus\nThou shalt obtain salvation,\nFor He bestoweth it.\n\nCHORUS: Valiant one, press onward,\nProclaiming the Truth;\nSaying unto the people:\nThat Jesus Christ\nGiveth them salvation.\n\nValiant one, faint not\nIn the conflict,\nFor thy labor God shall crown;\nGo and tell the lost\nThat the Lord gave His life\nTo save mankind.\n\nValiant ones who in the battle\nWere faithful,\nWho strove to save\nMankind:\nIn Heaven their reward they shall receive,\nWith the King eternally they shall live."
  },
  "388": {
    "title": "A Joyful Song",
    "lyrics": "Gladly I sing of Christ Jesus,\nSaved am I... Saved am I,\nFrom my sins... He hath set me free,\nChrist hath saved me... Saved.\n\nCHORUS: Saved am I... By the Lord,\nGlory, glory... I am His,\nI will give... Praise to the King,\nChrist hath... Saved me, saved.\n\nMy Saviour is Christ my King,\nSaved am I... Saved am I...\nIn glory full... With Him I shall be;\nChrist hath saved me.\n\nThe Good Shepherd... Set me free,\nSaved am I... Saved am I,\nNow my joy is to give Him praise,\nChrist hath saved me... Saved."
  },
  "389": {
    "title": "I Am Walking, Going to Glory",
    "lyrics": "I am walking onward, I go to glory,\nWhere through the ages I shall rest;\nI am walking onward, I doubt not,\nThat Jesus Christ will crown me there.\n\nCHORUS: 'Tis the blessed hope of the Gospel\nOf Jesus Christ, my good Saviour;\nOf the Gospel I am not ashamed,\nFor 'tis the power of Jesus my Redeemer.\n\nI am walking onward, I go to heaven,\nWhere my Christ will crown me there;\nI am walking onward, with great joy,\nTo the mansions He went to prepare.\n\nI am walking onward, I am a pilgrim,\nI am walking to eternity;\nI am walking onward, beside my Christ,\nAlong His way, He will help me."
  },
  "390": {
    "title": "Jesus Shall Come in His Glory",
    "lyrics": "Jesus shall come in His glory\nWith great majesty,\nTo raise up from the dust\nHim that is sleeping.\nCome quickly, Lord Jesus,\nMine eyes long to behold\nMy body transformed\nBy Thy great power.\n\nMy body transformed\nInto the heavenly image,\nShall be glorified\nWith life everlasting;\nMine eyes shall behold Thee,\nAnd not another in my stead;\nBelieving in Thy Word,\nThe dead shall live.\n\nMy Redeemer yet liveth,\nI know, and He reigneth;\nAnd at the end of our days,\nMine eyes shall behold Him;\nWalking in righteousness,\nThy face I shall see,\nWhen in Thy likeness\nJoyful I awake.\n\nBlessed are they\nWho have fallen asleep,\nBelieving in Him who liveth\nUnto all eternity;\nDeath hath no longer\nDominion over them;\nTheir bodies are clothed\nWith immortality."
  },
  "391": {
    "title": "Falling and Rising",
    "lyrics": "Falling and rising,\nI journey onward\nUnto the great City of God,\nSuffering and rejoicing,\nEver advancing,\nTill I behold my Lord.\n\nCHORUS: While a pilgrim here,\nI must not faint;\nEver I'll pursue the pathway\nTo the Heavenly Homeland.\n\nThough thistles and thorns\nUpon my pathway\nWound my life with sorrow,\nNo matter, 'tis my journey,\nI walk onward\nUnto the great City of God.\n\nMany stumbling blocks I'll face,\nBeyond all doubt,\nFor the tempter placeth them;\nYet my Jesus Christ\nGiveth me His help,\nTo overcome them with courage."
  },
  "392": {
    "title": "The Master's Beloved Doth Prepare",
    "lyrics": "The Master's beloved doth prepare,\nFor soon her Lord is coming;\nShe is arrayed, prepared, and adorned,\nTo meet her Lord.\n\nCHORUS: Oh, what joy! Hallelujah to God!\nOh, glory, saith the Congregation!\nWe will give glory to the Redeemer.\n\nMy Master tarrieth not, He draweth near,\nThe prophecies are being fulfilled;\nAnd rumors of war are already heard,\nAll proclaiming that Jesus will come.\n\nMan liveth in the world without comfort,\nWithout hope of salvation;\nYet the Church of the Lord is ever watching,\nEver waiting for her Redeemer.\n\nThe Church of the Lord feareth not,\nWhen the righteous Judge appeareth;\nFor awake she ever liveth, prepared,\nEver adorned with holiness."
  },
  "393": {
    "title": "To Be Near Christ",
    "lyrics": "To be near unto Christ\nIs a blessed reward;\nFar away from sin,\nAnd close to the Lord.\nFeeling the tender touches\nOf the Great Comforter,\nWhich through infinite grace\nHe poureth into the heart.\n\nCHORUS: /:/ Now I find myself\nFar away from sin;\nFor with Christ I am\nCrucified together /:/\n\nI feel so very joyful,\nAnd this is the gift of God;\nAnd I live in the rest\nOf Christ the Saviour.\nAnd today with all my soul\nI cry out with a loud voice:\nThere is none righteous like Christ,\nNor holy like God.\n\nTo be crucified\nWith the Saviour,\nAbsent from sin,\nIs what I desire;\nAnd also to be numbered\nWith those whom He redeemed;\nAnd at last to be crowned\nIn His eternal mansion."
  },
  "394": {
    "title": "Christ Hath Already Risen",
    "lyrics": "Christ hath already risen,\nIn the garden He is no more,\nHe is already in His mansion.\nHis power He manifested,\nHe overcame the enemy\nBy His death and resurrection.\n\nCHORUS: /:/ The Master hath already risen,\nThe sepulchre could not hold Him fast;\nAnd therefore He gave us life,\nGlory and honor to the faithful Lamb /:/\n\nUnto heaven He ascended,\nAnd in heaven He abideth,\nInterceding from on high;\nAnd the Church of the Lord\nIs sealed by Him,\nIn the heart through His goodness,\nA token of holiness.\n\nChrist hath already risen,\nToday proclaim the glad tidings;\nAmong the dead He is no more,\nAmong His own He dwelleth,\nIn the Church of the Lord;\nAnd Christ the King, the Good Shepherd,\nToday doth live and reign."
  },
  "395": {
    "title": "Blessed Be Jesus Christ",
    "lyrics": "Blessed be Jesus Christ,\nWho gave us salvation;\nHe hath shed His blood\nAnd demonstrated His love;\nTherefore united all together,\nWe bless the Lord.\n\nCHORUS: The angels in heaven\nThus render Him praise,\nFor His great mercy\nAnd His infinite love.\n\nHallelujah to Jesus Christ,\nWho gave us salvation;\nGlory hallelujah, hallelujah,\nHallelujah to our God;\nGlory hallelujah, hallelujah,\nHallelujah to the Redeemer.\n\nUnto Jesus Christ in heaven\nThey render adoration;\nGlory and strength,\nPower and majesty,\nBlessing and honor\nIs the beauteous song."
  },
  "396": {
    "title": "Joyfully Let Us All Exalt",
    "lyrics": "Joyfully let us all exalt\nThe sweet name of Jesus,\nWho through His love hath brought us forth\nFrom the darkness into light.\n\nCHORUS: Come, Lord, come, Lord,\nAll Thy Church doth await Thee now;\nEvery day she is preparing,\nFor well she knoweth Thou wilt come.\nEver sanctifying their souls,\nIn Thy mansions they shall dwell.\n\nToday all these hearts\nThat bless Thee, O Lord!\nAll of us have been washed,\nAnd confirmed in Thy love.\n\nToday all together we pray Thee,\nOn this day of blessing:\nTake us to rejoice with Thee\nForevermore in Thy mansion.\n\nAt Thy coming, King of Heaven,\nWe shall all go forth to meet Thee;\nAll in garments of pure white,\nEver with Thee to abide."
  },
  "397": {
    "title": "Knowing That There Is a God",
    "lyrics": "Knowing that there is a God, all should know\nThat adoration must be rendered unto Him. Knowing that the Creator\nIs Lord over all, let us worship with love;\nKnowing that in His plan, He prepared salvation\nFor the poor sinner, for good is He,\nAnd great is the love of the blessed Saviour.\n\nCHORUS: We all must render Him adoration today,\nAnd serve Him from the heart;\nCome before His altar with songs of praise,\nUnto our God, sing ye with love.\n\nToday we must know that Moses and Aaron\nShepherded a great people, directed by God\nAnd aided by Him, for He had compassion;\nFrom the great affliction, the cry of His people\nCame before His throne, and with mighty power\nAnd strength unequaled, the Lord delivered them.\n\nToday we must know that Jesus, the Great King,\nCame down from His throne, to give life\nUnto those that are His. Unto death He gave Himself,\nFor His is the soul, and He would not lose\nWhat His Father had formed. And offering His life\nAnd a fountain of blood, thus He gave us salvation."
  },
  "398": {
    "title": "Jehovah, Thou Art My Good Shepherd",
    "lyrics": "Jehovah, Thou art my Good Shepherd,\nThy hand leadeth me whithersoever I go;\nJehovah, Thou art my Good Shepherd,\nAnd with Thee I shall not want.\n\nCHORUS: With Thee I shall not want,\n/:/ I shall not want /:/\nWith Thee I shall not want,\nBecause Thou art my Good Shepherd.\n\nLord, Thy power shall uphold me,\nIn paths of life Thou wilt guide me;\nLord, Thou wilt ever watch over me,\nAnd with Thee I shall not want.\n\nLord, preserve me by Thy goodness,\nThy holy Word is the truth;\nIf at last I endure in Thy truth,\nTo glory Thou soon wilt bear me."
  },
  "399": {
    "title": "When Alone I Wandered",
    "lyrics": "When alone I wandered in the world,\nDespising the love of the Lord,\nIn a sea of sorrow so deep;\nI heard the sweet calling of love.\nAs a rose that perfumes the air,\nNow the Lord perfumes my whole being;\nHe preserves me from every brokenness,\nAnd delivers me from sorrow and pain.\n\nCHORUS: Precious gift of love and of peace,\nWhat comfort Thou givest my soul;\nPraise and glory to the Lord, Hallelujah!\nGlory, glory to the Lamb of God.\n\nI consecrate myself to serve Thee with joy,\nHe ever will be my help;\nPrecious gift of peace so beauteous,\nHow much joy to my soul it doth give!\nAs a father correcteth his children,\nEven so doth the Lord chasten me;\nHe imparteth His love and His wonders,\nAnd delivers me from condemnation.\n\nCome to Him, sinner, He waits for thee,\nHe offers thee a life far better;\nAnd to hold thee in His bosom He longeth,\nDo not slight so gracious a favor.\nHappy beside Him thou canst be,\nIf thou wilt follow Him anywhere;\nHe will guide thee without stumbling to heaven,\nAnd delivers thee from condemnation."
  },
  "400": {
    "title": "I Can Declare That Through Jesus",
    "lyrics": "I can declare that through Jesus\nI am exceeding glad;\nEver since I heard\nThe voice of invitation\nSaying unto me: \"Come unto Me,\nCome unto Me, and thou shalt rest.\"\n\nI can declare that through faith\nI have salvation sure,\nThrough holy baptism\nIn the Name of Jesus,\nWhich by Grace I have received,\nThrough an Anointed of the Lord.\n\nI can declare that through Jesus\nI am now sanctified;\nBy the Holy Spirit\nOf Grace, which He hath giv'n,\nWhich I received by faith\nUpon hearing His tender voice.\n\nI can declare that through Jesus\nI am now justified;\nBy that most precious blood\nMy Savior shed for me.\nUpon the tree of the cross\nAll my transgressions He hath paid."
  },
  "401": {
    "title": "Blessed Be the God of Abraham",
    "lyrics": "Blessed be the God\nOf Abraham, Isaac, and Israel;\nBlessed for His great goodness\nUnto His people faithful,\nBlessed unto eternity\nFor His almighty power;\nAll glory and dominion be\nUnto the faithful Lamb.\n\nCHORUS: Glory, glory,\nGlory unto our God,\nGlory, glory for His rich blessing,\nHe brought me forth from ruin and despair.\nGlory, glory! Hallelujah! Hallelujah!\nHallelujah to the Good Shepherd!\n\nUnto the God who guided Moses\nBe the blessing given;\nUnto the God who freed Daniel\nHonor and high praise.\nUnto the God of Elijah and Joshua,\nGod of wondrous virtue;\nUnto the God in eternity\nBe the dominion evermore.\n\nBlessed be God who fashioned me\nBy His mighty power;\nAnd by His love delivered me\nFrom all bondage free.\nAnd in His love He grants to me\nThis most blessed grace;\nTo stand with those who sing today\nUnto the faithful Lamb."
  },
  "402": {
    "title": "Great Joy Within My Heart I Feel",
    "lyrics": "Great joy within my heart I feel\nTo taste the liberty\nWhich Jesus did impart to me.\nMy soul rejoiceth now\nIn His great goodness;\nUnto the Lord Jesus be the blessing given.\n\nCHORUS: What joy it is to behold here\nThe beauty of the Lord Jehovah;\nLet all sing with fervor thus:\nHallelujah to the Most High God!\n\nWhat could I render unto Thee, Lord Jesus,\nFor the wondrous blessing\nWhich my heart enjoyeth?\nI will only sing and give Thee praise,\nBecause Thou art King over Israel.\n\nStrength, honor, glory, and renown\nBe to Christ the Redeemer,\nThe Lamb of boundless love,\nFor the liberty He granted unto me\nWhen He died upon the cruel cross."
  },
  "403": {
    "title": "Ye Blind, Come Unto Jesus",
    "lyrics": "Come, ye blind, before Jesus,\nImplore of Him His mercy;\nAnd He shall make you behold His light\nAnd crown you in eternal glory.\nI also was far away from Him,\nAnd blind was I as well;\nYet upon Jesus I called,\nAnd unto Him cried thus:\n\nCHORUS: Jesus, Thou Son of David,\nHave mercy upon us;\nLord, have mercy on me,\nWe desire to see Thee with our eyes.\n\nWhen we walked in wicked paths,\nFar other were our thoughts,\nBecause sin and iniquity\nHad darkened our blinded eyes.\nAnd when of Jesus we heard tell,\nThat He wrought wonders here below,\nUnto Jesus Christ we came,\nAnd called upon Him thus:\n\nNow do I joy to contemplate\nThe tender mercy of Jesus;\nBy His power He made me to behold\nThe unspeakable Gift of His light.\nAnd if astray we find ourselves\nAlong the paths of evil,\nWe have Jesus Christ our Lord,\nAnd unto Him we may cry:"
  },
  "404": {
    "title": "Oh, What a Beauteous Story!",
    "lyrics": "Oh, what a beauteous story!\nIt telleth us that Christ\nHath gone to prepare for us\nYonder in glory,\nYonder where He dwelleth,\nAn eternal resting place.\n\nCHORUS: For the sinner\nWho in Christ is found,\nWho loveth His word with all his soul,\nHe surely shall live,\nHe surely shall reign,\nWith the Savior blest.\n\nGlorious hope sublime,\nGift unspeakable,\nThe Savior declareth to us:\nTo know there awaiteth\nThe beautiful crown\nWhich the Lord shall give to us.\n\nHow beauteous and fair\nIt shall be to rejoice\nWith the Savior blest,\nIn that royal crown\nWhich is now prepared\nBy our, our Redeemer."
  },
  "405": {
    "title": "Fill My Heart with Thy Presence",
    "lyrics": "Fill my longing heart\nWith Thy presence, O Lord!\nGrant me more joy,\nPeace, contentment, and gladness,\nThat my soul may truly feel\nThy holy blessing divine.\n\nCHORUS: /:/ Grant me more joy,\nRejoicing, and also peace;\nThat my soul may truly feel\nThat Thou art with me still /:/\n\nI feel that Thy power\nTaketh away all my distress;\nTherefore I pray that Thou wilt fill\nThis soul of mine\nWith that most holy fire\nOf the Great Comforter.\n\nFill my whole being\nWith Thy presence, O Lord!\nI yearn to feel\nThat Thou comest unto my soul,\nAnd filled with rejoicing,\nMay give Thee all the praise."
  },
  "406": {
    "title": "Christ Keepeth Ever",
    "lyrics": "Christ keepeth ever,\nI can trust in Him;\nHe leaveth me never,\nI can trust in Him;\nFor as the Rock,\nEternal Rock of Ages,\nSteadfast I'll stand.\n\nCHORUS: Nothing, nay, nothing shall move my soul,\nNothing, nay, nothing shall move my soul;\nFor as the Rock, eternal Rock of\nAges, steadfast I'll stand.\n\nStrong is Christ Jesus,\nI can trust in Him;\nAll things He provideth,\nI can trust in Him;\nFor as the Rock,\nEternal Rock of Ages,\nSteadfast I'll stand.\n\nThough many forsake me,\nI can trust in Him;\nThough others deceive me,\nI can trust in Him;\nFor as the Rock,\nEternal Rock of Ages,\nSteadfast I'll stand."
  },
  "407": {
    "title": "I Follow My Redeemer",
    "lyrics": "I follow my Redeemer,\nHe is my Shepherd good,\nA sheep of His pasture am I;\nHe leadeth me in love,\nHe is my Shepherd good,\nHe gently leadeth me along.\n\nCHORUS: How good is the Lord,\nGracious beyond compare;\nHe is forgiving,\nNever returning ill for ill.\n\nI follow Christ Jesus,\nHe is a Guide to me,\nHe shepherdeth me on the way;\nIn paths of grievous error\nHe suffers me not to stray,\nFrom every harm He guardeth me.\n\nJesus Christ the Lord,\nHe who careth for me,\nLooketh down from His throne on high;\nHe granteth me protection,\nHe remembereth me,\nNor forgetteth me for a moment."
  },
  "408": {
    "title": "The Good Shepherd Is Calling",
    "lyrics": "The Good Shepherd is calling\nUnto the sheep that are lost;\nThey wander without rest;\nJesus the Good Shepherd\nCame forth to rescue them.\n\nCHORUS: O sheep that wand'ring strayest,\nFar from the Shepherd good;\nHear thou from Him His Word,\nWhich saith: \"Come, sinner, come.\"\n\nThe Good Shepherd continueth seeking\nThose that are scattered abroad,\nWhom through their much wand'ring\nEvil hath torn and bruised;\nJesus the Good Shepherd\nGiveth them salvation.\n\nThe Good Shepherd presseth onward\nThrough valleys and mountains steep;\nThrough rugged thickets He goeth\nWhere lurketh peril deep;\nWithin His arms of love\nThe sheep He'll gently bring."
  },
  "409": {
    "title": "My Physician Is the Lord Jesus",
    "lyrics": "My Physician is the Lord Jesus,\nHe healeth me, He healeth me;\nHe taketh away my sickness\nAnd putteth health in my body,\nHow good is the Lord!\nTherefore I give Him praise.\n\nCHORUS: My Christ healeth me,\nBoth body and soul,\nAnd calm returneth\nUnto my heart.\n\nMy dearest friend is Jesus my King,\nHis love comforteth me\nWhen sorrowful is my heart.\nHis word reviveth and giveth me courage;\nHow good is the Lord!\nTherefore I give Him praise.\n\nMy truest guide is my Shepherd good,\nMy heart is well content;\nHe telleth me soon I shall dwell\nYonder in the New Jerusalem;\nHow good is the Lord,\nTherefore I give Him praise."
  },
  "410": {
    "title": "At Thine Altars, O Lord of Hosts!",
    "lyrics": "At Thine altars, O Lord of hosts!\nAt Thine altars I long to dwell;\nDay and night, O Lord, there I yearn to abide,\nSinging praises unto Thee, O God.\n\nCHORUS: Lord God of hosts,\nThou art present both day and night\nAt Thine altars, O Lord!\nO Lord, behold my deep desires,\nFor Thou wilt grant them unto me.\n\nNeither gold nor silver have I desired, my good Savior,\nRiches that bring no health nor peace;\nWhat I have desired, O Lord,\nIs to dwell forevermore yonder where Thou dost dwell.\n\nThy Tabernacle and Thy courts I shall ever desire,\nTo worship Thee, my gracious Lord;\nAnd through Thy gates I will ever enter in,\nBringing my prayer and songs of highest praise."
  },
  "411": {
    "title": "As Sweet Perfume",
    "lyrics": "Even as perfume\nThat breatheth a fragrance sweet;\nEven as perfume\nGiving forth a pleasant savor;\nEven as incense\nOffered unto Jesus Christ:\nSo is the prayer\nFull of faith, full of love.\n\nCHORUS: Now faith is the evidence\nOf things not seen;\nYet well we know when He shall appear,\nWe shall be like Him, even as He is.\n\nThe censer and the incense\nAre held in the hand\nOf the holy angel who serveth\nThe Redeemer;\nFor His chosen people\nEver continue breathing forth\nThe earnest prayers\nThat perfume the Lord.\n\nThrough prayer Elijah caused\nFire to come down from above;\nAnd by faith Joshua stayed\nThe sun in its course;\nAnd Jesus Christ through faith\nWrought mighty marvels,\nEven the dead\nFrom the tomb He raised."
  },
  "412": {
    "title": "A Servant of Thine Am I, O Lord",
    "lyrics": "A servant of Thine am I, O Lord,\nThy holy will I'll do;\nSpeak to Thy servant, O Lord!\nThy servant here will hear.\n\nCHORUS: I would be ever labouring\nIn Thy sacred work;\nIn Thy Vineyard striving;\nAnd reach unto heaven,\nTo say before Thy presence:\nLord, I am Thy servant.\n\nI am Thy servant, O Lord!\nAnd faithfully I'll serve Thee;\nSpeak to Thy servant, my Lord,\nThy voice I will obey.\n\nI yearn to reach Thy mansion bright,\nWith soul unstained and pure;\nIf I endure unto the end,\nChorus: A crown Thou wilt give me."
  },
  "413": {
    "title": "With Our Voices",
    "lyrics": "With our voices in fervent love,\nToday we bless our God;\nAnd our songs with one accord\nAscend to heaven as praise,\nLike sweet perfume before the Creator.\n\nCHORUS: Sing... Sing... Sing...\nSing to the God of Creation;\nSing... Sing... Sing...\nUnto Him who giveth Salvation.\n\nSing today, sing to the Savior,\nWho came down from heaven to earth;\nWho left His exalted Throne,\nTherefore is He worthy of worship,\nUnto Him be every blessing.\n\nLet all the nations come unto Him,\nRepentant in heart and mind,\nThat they may receive pardon today,\nAnd live forever with the Lord,\nWithin the mansions of His home."
  },
  "414": {
    "title": "There Is a Blessed Kingdom",
    "lyrics": "There is a blessed kingdom,\nWhere we shall rejoice and behold\nFace to face the Lamb of God;\nAnd we shall enjoy that holy peace,\nWhich only in heaven\nShall be infinite forevermore.\n\nCHORUS: With the celestial choir I long to go,\nAnd join my song unto the Lamb of God,\nAnd dwell forever in that eternal mansion,\nWhere peace and love ever reign.\n\nWhat a precious kingdom Christ hath prepared,\nA wondrous dwelling place,\nAnd a beauteous heavenly home;\nIts celestial choirs adorn the throne,\nAll of them singing\nUnto the blessed Lamb of God.\n\nLikewise on earth this Church doth sing\nHymns of sacred praise\nUnto the blessed Lamb of God;\nAnd when we stand in that eternal kingdom,\nWe all shall sing with Him,\nChorus: Sacred choir of God."
  },
  "415": {
    "title": "How Beauteous a Banner",
    "lyrics": "How beauteous a banner we unfurl today,\nThe royal standard of the cross,\nThe truth, the gospel, the holy crest\nOf the soldier of Jesus.\n\nCHORUS: Forward... Forward...\nFollowing our Savior on,\nWith a steadfast faith in Jesus,\nForward march with courage bold.\n\nLet us ever preach what God hath spoken,\nOf the blood of Jesus,\nHow it cleanseth mortal man from sin\nAnd purchaseth salvation full.\n\nUnto the world let us fervently proclaim\nThis wondrous story of the cross;\nWithout ceasing let us bless the Redeemer,\nWho brought unto us peace and light.\n\nIn heaven our song of joy shall be:\nHallelujah unto Jesus!\nOur hearts shall overflow up there\nWith love and gratitude."
  },
  "416": {
    "title": "The Holy Spirit",
    "lyrics": "The Holy Spirit is being poured out\nUpon all mortal flesh;\nBlessings from heaven today can be beheld,\nLike the early rain;\nThe brethren are preaching, of heavenly things they speak,\nAnd they sing and pray;\n/:/ A heavenly feast is what we now behold,\nEven as the glorious day of Pentecost /:/\n\nIf we ask for the unction from on high,\nWe likewise shall rejoice;\nThe Holy Spirit shall fill our lives\nWith joy unspeakable;\nFair gifts we shall behold and we shall feast,\nSinging hallelujah.\n/:/ The sick shall be healed by laying on of hands,\nBecause Christ is the same yesterday\nAnd unto the end /:/\n\nWhen Christ shall descend\nWith power sublime, we shall behold His glory;\nThe stars shall sing,\nThe heavens and seas, the rivers and mountains;\nThroughout the universe the glory of Christ\nOur eyes shall behold.\n/:/ How glorious the day when Christ\nShall descend,\nFor all of His children He shall catch away /:/"
  },
  "417": {
    "title": "Now Will I Sing",
    "lyrics": "Now will I sing of that\nWhich my Beloved told me;\nExceedingly He loved me,\nFor me He was crucified.\n\nCHORUS: He bid me that I should be ready,\nFor very soon He shall return;\nHe went to prepare the mansions\nWhither He shall bear me home.\n\nThose mansions are established\nIn a beauteous City fair;\nTwelve foundations it possesseth,\nA thing most celestial.\n\nBoth day and night my Beloved\nDoth ever say unto me:\nThat I should make myself ready,\nEver praying and watching.\n\nHe said that the day nor the hour\nNo man alive shall know;\nBut even as the lightning\nIn a moment He shall come.\n\nI must be fully prepared,\nWith my lamp burning bright;\nWithout a spot or a wrinkle,\nAll clothed in spotless white."
  },
  "418": {
    "title": "If Thou Art Weary",
    "lyrics": "If thou art weary and sorrowful,\nCome thou and find rest;\nOf all thine iniquities\nReceive forgiveness free,\nWhich the Lord Jesus Christ\nCan abundantly bestow;\nHe giveth peace and comfort\nWithin thy troubled heart.\n\nCHORUS: Why will ye die without need?\nWhy will ye suffer in wickedness?\nWhy come ye not today to rest?\nJesus doth offer us a goodly home.\n\nUnto all the weary\nThe Savior calleth,\nAnd unto all captives\nHe offereth liberty;\nJesus is a faithful friend,\nAnd can grant it unto thee,\nFor He is full of compassion\nAnd plenteous in mercy.\n\nIf sorrowful and heavy laden\nWith this life thou art,\nAnd thy soul hath not found\nIn the world any peace,\nJesus hath promised\nAn eternal dwelling place,\nFor the contrite and repentant\nWho would enter into rest."
  },
  "419": {
    "title": "Yonder in the Kingdom",
    "lyrics": "Yonder in the kingdom\nOf that thousand-year reign,\nWhich my Christ Jesus\nDeclared was to be;\nAll crowned with glory,\nWith laurel and palm,\nAnd with royal diadems\nWe shall behold ourselves.\n\nCHORUS: Our brows encompassed\nWith glorious diadems,\nWith Christ the Master\nWe shall behold ourselves;\nArrayed in white raiment,\nSinging in heaven\nUnto our gracious King.\n\nYonder in the kingdom\nOf peace and of joy,\nWhere we shall enjoy\nFullness of peace;\nAll of us shall rejoice in\nThe sweet presence of Him\nWho our blessed reward\nShall surely bestow.\n\nSinging in Heaven\nTo the King of kings,\nUnto Jesus the Christ\nWho redeemed us from sin;\nAll of us shall behold\nHis countenance bright,\nBearing on our forehead\nThat prize of His love."
  },
  "420": {
    "title": "The Lion of Judah Is Worthy",
    "lyrics": "The Lion of Judah,\nWorthy is He to open the Book;\nAnd to loose the seals thereof,\nFor the Lamb was slain,\nAnd with His blood He hath washed us now.\n\nCHORUS: Worthy is He of all power and might,\nFor He hath vanquished fierce Satan;\nGlory to God! For His mighty power,\nBlessed be He, Hallelujah, Amen!\n\nUnto the Lion of Judah be glory\nAnd power,\nFor His mighty power;\nHe saved us by His wondrous love,\nTo Him be glory, Hallelujah, Amen!\n\nThe Lion of Judah worthy is\nOf honor and praise,\nHallelujah unto Him!\nFor the victories He hath shown to us\nIn the defeat He dealt to Satan.\n\nUnto the Lion of Judah, Hallelujah!\nGlory unto Him!\nPraise, praise, praise;\nBlessed King, mighty and faithful,\nTo Him be glory, Hallelujah, Amen!"
  },
  "421": {
    "title": "Come Unto Me, Ye Sorrowful",
    "lyrics": "Come unto Me, ye sorrowful,\nWeary of your sin;\nCome ye, drink of the water\nFrom the rich fountain flowing.\nWithout price and without money,\nCome ye, come ye and buy;\nFor Christ is calling:\nCome unto Me and rest.\n\nCHORUS: Come unto Me, saith the LORD,\nCome unto Me, to rest;\nThough your sins be black as night,\nLike snow shall they become.\n\nHo, all ye that are thirsty,\nCome ye, buy and eat;\nHearken diligently,\nAnd eat that which is good;\nWhich shall delight your soul\nWith life spiritual:\nIf unto God thou drawest near now,\nWith Christ thou shalt live.\n\nCome now, and let us reason together,\nSaith the Lord Jehovah;\nFor all through My blood\nShall be blotted out.\nDeceive no more thy soul,\nSaying, \"Not today\";\nPerchance tomorrow is too late,\nAnd at last thou shalt be lost."
  },
  "422": {
    "title": "Shall the Youth Fail in the Defense of Zion?",
    "lyrics": "Shall the youth fail in the defense\nOf Zion?\nWhen the enemy approacheth,\nShall we flee without a fight? (NO)\n\nCHORUS: Grow firm in the faith\nWhich we keep;\nFor truth and righteousness\nWe strive.\nHonor God, fight for Him,\nAnd for His cause watch evermore.\n\nWhen we behold the wicked\nAssail the counsel of God;\nShall we remain undecided,\nShall we be without fear? (NO)\n\nLet us seek our salvation,\nStriving after the truth;\nAnd shall the youth with zeal\nFight and watch? (YES)\n\nLet us strive to be found\nWorthy of the Kingdom of God;\nAnd to join with the righteous,\nWho have been faithful to Him? (YES)"
  },
  "423": {
    "title": "With Psaltery",
    "lyrics": "With psaltery, timbrel, and flute\nKing David sang praises to God,\nAnd we with all our soul\nSing unto Him with our heart here below.\n\nCHORUS: Unto Jesus the Lord\nBe glory and honor,\nUnto the Lamb of God\nBe all blessing.\n\nSinging is truly beautiful\nWhen the soul singeth with love,\nAbove all most precious\nWhen Christ cometh as our highest praise.\n\nWith psaltery, timbrel, and flute\nA joyful and goodly song is heard,\nAnd singing with all our soul,\nThe best is to give honor unto God."
  },
  "424": {
    "title": "Let Us Lift Up Our Voice to the Almighty God",
    "lyrics": "Let us lift up our voice\nUnto God Omnipotent;\nAnd give glory to the Lord,\nSaying unto Him thus;\nBlessed be\nThe Holy One of Israel,\nWhich wast, and art,\nAnd art to come.\n\nCHORUS: Hallelujah!... Amen\nHallelujah!... Amen,\nThe heavenly Lamb\nBe blessed,\nThroughout all eternity.\n\nLet us lift up our voice\nUnto Christ the Savior;\nFor the victories He giveth us,\nUnto our God\nLet us sing with love\nAnd gratitude\nFor granting us freedom\nFrom bondage.\n\nThe LORD is our God,\nOur Deliverer;\nAnd King of kings is the LORD,\nSay ye unto Him;\nBlessed be the Holy One\nOf Israel,\nHe is our refuge,\nAnd our faithful Friend."
  },
  "425": {
    "title": "When Christ Called Me to Obey His Word",
    "lyrics": "When Christ called me,\nHis Word to obey;\nDead was my soul,\nAnd I could not understand\nThe voice that called me,\nSweet voice of the Savior.\nIn sin lay my soul,\nYet today I give Him praise.\n\nCHORUS: Praise, praise unto my Lord;\nBlessed throughout all eternity.\n\nIn my despair\nI began to ponder,\nThat no other God had I\nWho could save me\nFrom death so fatal;\nFor without God I was to die,\nNot knowing if there were\nA future for my soul.\n\nWhen I could understand\nAll things in my Lord,\nI gave myself wholly to Him\nWith all my heart.\nMy sorrows and grief,\nAll I laid upon my Lord;\nIn serving Him I delight,\nFor He was my defender.\n\nSoul who visitest today\nThis congregation,\nI invite thee, come to Christ,\nIn Him thou shalt find pardon.\nIf thy soul be weary\nAnd in despair;\nHe imparteth peace and calm,\nAnd giveth thee His blessing."
  },
  "426": {
    "title": "To Christ, My Faithful Shepherd",
    "lyrics": "Unto Christ, my faithful Shepherd,\nMy heart giveth adoration;\nHeavenly Rose of Sharon,\nThat perfumeth the heart.\nJesus is my helper\nIn every tribulation;\nHe is within my heart,\nImparting unto me His love.\n\nCHORUS: Jesus Christ is the Shepherd\nOf the souls that He hath bought;\nHe dearly purchased them\nWith the blood that He hath shed.\n\nUnto Christ, my faithful Shepherd,\nI worship with all my love;\nHeavenly Rose of Sharon,\nThat blossomed in my heart;\nIn Christ I found forgiveness,\nHe gave me also shelter;\nIn that fair and lovely Zion\nI shall dwell with my Lord.\n\nUnto Christ, my faithful Shepherd,\nI hold Him in my heart;\nHeavenly Rose of Sharon,\nThat blossomed in my heart;\nNow have I in my heart\nThe Holy Comforter;\nThe Lord gave me this Gift\nTo enter into His mansion."
  },
  "427": {
    "title": "As Gold and Silver",
    "lyrics": "As gold and silver that are\nPrecious metals and are refined in\nThe crucible, beneath the power of the fire,\nBurning away all that is evil,\nEven so shall I be, Lord.\n\nCHORUS: Even so shall I also be; grant unto me, Lord,\nTo burn away all that is evil, to forsake all\nSin; grant unto me, Lord, to do Thy\nWill.\n\nIn the crucible of life I walk\nSecure, though I may seem to faint,\nYet am I certain and assured that\nJesus Christ is my guide, and thus shall I overcome.\n\nWhen the conflicts crowd upon me, when\nEvils increase, in Christ I have\nSecurity, for I know that the trial\nIs the crucible of life, to purify."
  },
  "428": {
    "title": "Come, Let Us Sing Joyfully Unto the LORD",
    "lyrics": "O come, let us sing joyfully\nUnto the LORD: let us make a joyful noise\nTo the rock of our salvation;\nLet us come before His presence\nWith thanksgiving;\nLet us acclaim Him with psalms.\nFor the LORD is a great God:\nAnd a great King above\nAll gods, for in\nHis hand are the deep places\nOf the earth and the heights of\nThe hills are His also.\nThe sea is His also\nFor He made it:\nAnd His hands formed the dry land.\n/:/ O come, let us worship and bow down,\nLet us kneel before\nThe LORD our Maker,\nBecause He is our God /:/"
  },
  "429": {
    "title": "Sing Joyfully Unto God",
    "lyrics": "Sing joyfully unto God,\nAll ye lands of the earth;\nServe the LORD with gladness,\nCome before His presence\nWith singing.\nKnow ye that the LORD, He is God;\nHe hath made us, and not we\nOurselves;\nWe are His people\nAnd the sheep of His pasture.\nEnter into His gates\nWith thanksgiving,\nInto His courts with praise:\nPraise Him, bless His Name!\nPraise Him, bless His Name!\nFor the LORD is good;\nHis mercy is everlasting,\nAnd His truth endureth unto\nAll generations... Amen."
  },
  "430": {
    "title": "God Is Here!",
    "lyrics": "God is here!\nAs sure as the air that I breathe,\nAs sure as in the morning\nThe sun doth rise,\nAs sure that when I speak to Him,\nHe can hear me.\n\nThou canst feel Him\nAt thy side at this very moment;\nThou canst bear Him,\nYea, deep within thy heart;\nJesus is here, if thou wilt,\nThou canst feel Him."
  },
  "431": {
    "title": "I Desire That Thou Help Me",
    "lyrics": "I desire that Thou help me, Lord,\nI desire in my life to triumph;\nIn Thee alone is my confidence,\nAnd also my hope,\n/:/ That very soon Thou wilt do so /:/\n\nCHORUS: Only with God shall I overcome in the\nWorld\nOnly with Him shall I triumph,\nI desire to be with Christ my God\nYonder in His mansion.\n\nI desire that Thou give me more courage,\nI desire to overcome the wicked one;\nI must fight for my soul,\nUnto me most dear,\n/:/ I would not lose it /:/\n\nI desire to behold my Savior,\nI desire to see Him even as He is;\nI cherish my great longing,\nTo sing my songs\n/:/ When I come unto Him /:/"
  },
  "432": {
    "title": "The LORD Is My Shepherd, I Shall Not Want",
    "lyrics": "/:/ The LORD is my Shepherd /:/\n/:/ I shall not want /:/\nIn green pastures\nHe maketh me to lie down:\nBeside the still waters\n/:/ He leadeth me /:/\n/:/ He restoreth my soul /:/\nHe leadeth me in paths of righteousness\n/:/ For His Name's sake /:/\nYea, though I walk in the valley\nOf the shadow of death,\nI will fear no evil;\nFor Thou art with me.\nThy rod and Thy staff,\nThey comfort me;\nThou preparest a table before me\nIn the presence of mine enemies;\nThou anointest my head with oil:\n/:/ My cup /:/ runneth over.\nSurely goodness\nAnd mercy shall follow me\nAll the days of my life:\n/:/ And in the house of the LORD /:/\nI will dwell for length of days:"
  },
  "433": {
    "title": "Help Me, O Lord",
    "lyrics": "Help me, O Lord, help me, my God:\nI cannot alone continue in Thy way...\nMay Thy Spirit lead me... until I reach my goal;\nThy face I long to see, when Thou art with me.\n\nCHORUS: /:/ Abide with me unto the end,\nUntil I finish my race...\nI desire to be faithful to Thee,\nAnd faithful until I die /:/\n\nI believe in Thee, Lord, and believe that Thou art able;\nIn Thee is all power, in heaven and in earth;\nLook not upon what I am, so lacking in Thy presence,\nThou art a God of love, and God most excellent.\n\nHard are the trials, and Thou knowest how heavily\nThey weigh;\nThey wound my heart and pierce even to the soul;\nTherefore I pray that Thou give me sweet peace,\nAnd help me to the end, should my strength fail me."
  },
  "434": {
    "title": "Like the Palm Tree",
    "lyrics": "Cause me to grow, O Lord, like the palm tree,\nLike the palm tree in the house of the LORD;\nMay Thy doctrine take root in my soul,\nThat I may grow strong and have assurance;\nMay my fruit be fresh and abundant,\nMay it be a fruit overflowing with holiness,\nAnd may it serve as food unto the people,\nThat they may lay hold of Thy grace.\n\nCHORUS: Make of me, O good Jesus,\nAn instrument of Thy love,\nAnd that I may publish abroad\nThy greatness and Thy praise;\nThat the people everywhere\nMay behold Thy glory,\nAnd for their souls obtain salvation.\n\nSuppliant and humbled I beseech Thee,\nO Eternal Father, in the Name of Jesus,\nThat Thou fill me with virtue like the palm tree,\nWhich from its trunk hath sturdy strength;\nThat in spiritual height I may stand forth,\nYet also possess a tender heart,\nAnd understand the sorrows and afflictions\nOf the souls that wander in error.\n\nThat in burning places and deserts,\nParched lands where the sun wearieth,\nAnd men, weary and thirsty,\nIn agony suffer despair—\nLike the palm tree in the oasis of life,\nMay I bear fruit that they may reach:\nIt is the spiritual fruit of Thy Word,\nThy Word which is life and truth."
  },
  "435": {
    "title": "Let Us Not Faint, Brethren",
    "lyrics": "Let us not faint, brethren,\nNor let our faith fail,\nFor thus hath Jesus spoken:\n\"I will never leave you.\"\n\nCHORUS: It is Jesus, the Shepherd,\nWho is ever watching\nOver His Church which He hath bought;\nHe never will forsake us,\n'Tis the promise He hath given us.\n\nServants shall we nevermore be\nUnto sin and wickedness;\nJesus was our Captain,\nAnd hath given us liberty.\n\nThe Christian who is valiant\nCasteth aside temptation,\nAnd overcometh his enemy\nThrough Jesus, the King of Zion.\n\nWhen battles come upon us\nWith the dragon of the pit,\nThere shall come also to aid us\nOur Heavenly Father.\n\nWe must not be children tossed to and fro,\nNor be carried everywhere\nBy winds of doctrine\nThat come to move us."
  },
  "436": {
    "title": "From the Evil World",
    "lyrics": "From the evil world a Friend hath saved me,\nWhen He found me lost in iniquity;\nMy afflictions and burdens He took away,\nBlessed be the Son of God!\n\nCHORUS: Lost was I in this vile world,\nNow I have a faithful Friend;\nI lost the worldly flatteries,\nToday I have a Shepherd\nWhose name is Jesus Christ the King.\n\nVain customs the Lord hath taken from me,\nI have forgotten them to follow Jesus;\nNaught care I for the world and its pleasure,\nI have Christ, who is good and faithful.\n\nHe took my burden, my sins He forgave,\nHe cast them into the deepest sea;\nNow am I joyful, the Lord hath set me free,\nFrom the evil world I depart."
  },
  "437": {
    "title": "I Have Joy with the Creator",
    "lyrics": "I have joy with the Creator,\nHis holy love hath saved me;\nHe hath washed away my wickedness,\nHallelujah to His goodness!\n\nCHORUS: Hallelujah to the Savior!\nHallelujah to the Redeemer!\nHallelujah to the God of love!\nHallelujah to the Good Shepherd!\n\nI delight in my Creator,\nJesus Christ, the Good Shepherd;\nBy His grace I am saved,\nHallelujah to the Lord!\n\nMy trust have I in God,\nHe crowneth me with blessing;\nI will lift up my voice to Him,\nHallelujah to the God of love!\n\nI am happy with the Savior,\nHe delivereth me from temptation;\nHe giveth me His blessing,\nHallelujah to the King of Zion!"
  },
  "438": {
    "title": "Let All the Redeemed Sing",
    "lyrics": "Let all the redeemed sing\nUnto the Lamb of God;\nLet all say with thanksgiving:\nUnto Jesus /:/ Be the blessing /:/\nUnto the Lamb of God.\n\nCHORUS: Unto Jesus the Lord,\nWho made the heavens and the earth,\nBe the glory and honor;\nFor His goodness and majesty,\nBe the blessing.\n\nLet songs of rejoicing ring out\nUnto Christ the Savior,\nSinging ever unto Jesus Christ\nThe Lord /:/ Be the blessing /:/\nUnto Jesus, the Great King.\n\nAll ye nations, heavens and earth,\nSing unto our God;\nFor holy is Jesus Christ,\nAnd Great King /:/ Be the blessing /:/\nUnto the Lamb of God."
  },
  "439": {
    "title": "I Touched Thee, Lord",
    "lyrics": "\"If I might but touch His garment,\nI know that I might be healed,\"\nSaid a woman who was tormented,\nAnd whom physicians could not heal.\n\nCHORUS: But the multitude thronged about Jesus,\nAnd it was impossible to draw near\nUnto where He was...\nYet the faith of that woman\nPrevailed over the multitude,\nAnd she drew near unto Jesus... and touched Him.\n\nIf thou draw near, and touch Him\nBy faith, thou couldest be healed;\nAnd thou shalt perceive that Christ asketh thee:\n\"Who touched Me? Virtue is gone out of Me.\"\n\n2ND CHORUS:\nI touched Thee, Lord Jesus,\nGreat was my need;\nAnd only this I know, that Thou, my God,\nCouldest help me...\nFor unto everyone that believeth,\nWhatsoever he asketh Thou wilt give;\nIt is the promise of the Lord... and He is faithful."
  },
  "440": {
    "title": "The Tempests of the Air Have Borne",
    "lyrics": "The tempests of the air did bear\nUnto mountains the clouds of the sea;\nAnd there unleashed their raging wrath\nWith sorrows of death and cruelty.\n\nCHORUS: O torrent! that waterest the valleys\nWhich desolate with death remain;\nSuffer not my poor soul to be lost\n'Midst trials, and anguish, and pain.\n\nWith terror the multitudes gazed\nOn the finished, blest work of His love,\nWhereby alone can be saved\nThe vilest poor sinner on earth.\n\nWhen peace and sweet stillness did reign,\nAnd the waters so calmly did flow,\nAt Calvary a fountain was formed,\nAnd the souls that were dead lived anew.\n\nAnd souls that in death are now found,\nLike flowers all withered and dry,\nMay now drink of the life-giving stream,\nAnd anew shall they have lasting life."
  },
  "441": {
    "title": "Glory Without End",
    "lyrics": "When all of my struggles are ended down here,\nAnd safely in heaven I ever shall be,\nWhen my blessed Lord I behold standing near,\nThrough ages unending my glory shall be!\n\nCHORUS: That shall be glory, glory without end,\nGlory without end, glory without end;\nWhen by His grace I His face may behold,\nThat as my glory unending shall be.\n\nWhen by His grace I am granted to have,\nIn mansions celestial a dwelling of peace,\nAnd ever and always His face I may see,\nThrough ages unending my glory shall be.\n\nJoy everlasting 'twill be to behold\nAll of the loved ones I cherished below;\nYet to enjoy the blest presence of Christ,\nThrough ages unending my glory shall be."
  },
  "442": {
    "title": "Beyond the Stars",
    "lyrics": "Far beyond the starry skies\nI would look upon my Lord,\nAnd there behold His countenance in love,\nAnd express with holy joy\nThe gratitude of my heart.\n\nCHORUS: Yonder, yonder where Jesus abides,\nThe Lamb of God, my Savior and Lord:\nI would see the Redeemer of my soul,\nEver to dwell with Him there.\n\nFar beyond the firmament\nWhich I contemplate below,\nI would dwell with my Savior and Lord,\nIn the mansion He prepared for us.\n\nZion, city most fair and bright,\nWhere my God I shall adore;\nWhen I am with Him, there in His home,\nWeeping shall be no more,\nOnly songs of praise shall we hear."
  },
  "443": {
    "title": "If Thou Wilt Fix Thine Eyes on Christ",
    "lyrics": "If thou wilt fix thine eyes on Christ,\nThe Lamb of heavenly grace,\nA fount divine,\nA fount divine of love,\nThou hast chosen what is best,\nFor only in Christ is salvation found.\n\nCHORUS: Yea, in Jesus Christ is salvation found,\nOnly in Jesus Christ is pardon given;\nFor in Jesus Christ is a rich reward:\nCome unto Him, O sinner!\n\nIf thou wilt fix thine eyes on Christ,\nNever shalt thou slip,\nNever shalt thou fall;\nMany shalt thou see fall into sin,\nYet it shall not come nigh thee,\nFor my God shall surely save thee.\n\nBeholding the children of Jesus Christ,\nWho do His holy will,\nLiving in sanctity;\nWith them thou shalt at last arrive\nAt the mansion where Christ abides,\nWhere thou shalt dwell forevermore."
  },
  "444": {
    "title": "If Thou Wilt Fix Thine Eyes on Christ",
    "lyrics": "Upon a dark and shadowed eve,\nOut on the deep, wide sea,\nA vessel was sorely tossed and tried,\nAll rowed in anxiety.\n\nCHORUS: Row on, row on, keep rowing,\nRowing with faith and courage high;\nShow forth thine earnest strength,\nStrive on, strive on till victory!\n\nMany contrary winds arise\nThat beat upon the open sea;\nRow on, row on, keep rowing on,\nRowing onward with all thy love.\n\nChrist sends thee forth into the fight,\nAnd thee behooves it to obey;\nNever resist Him, brother dear,\nKeep striving on, 'tis thy sacred charge.\n\nLet not the trials make thee fear,\nO brother in the Lord;\nRow on, row on, keep rowing on,\nKeep striving on with all thy love."
  },
  "445": {
    "title": "Bearing the Cross of Jesus",
    "lyrics": "Bearing the sacred cross of Jesus,\nWe shall attain unto realms on high;\nHe showed the pathway by His cross\nTo reach the heavenly Eden above.\n\nCHORUS: How gladly thus can we walk our way\nWhen Christ is our celestial Guide;\nFirmly advancing, ever marching on,\nLed by the mighty hand of the Lord.\n\nHow sweet it is to suffer for Jesus,\nThere is an end that leads to Him;\n'Tis the joy of life everlasting\nWhich the Christian hath longed to win.\n\nLet us follow the pathway of light,\nOf truth, of righteousness, and love;\nFor in it my Jesus will surely be,\nWiping away thy tears and pain."
  },
  "446": {
    "title": "The Love of God",
    "lyrics": "The love of God, I feel in my heart,\n/:/ The love of God /:/\nLove hath today salvation also given,\nGlory to Christ for His wondrous love!\n\nCHORUS: Christ is mine, yea mine, glory be to Him,\nHe hath given me peace and happiness;\nChrist is mine, yea mine, glory be to Him,\nMine through all eternity.\n\nHe hath placed in my soul a sweet, gentle peace,\n'Tis the holy peace, 'tis the peace of God;\nAnd at once He imparts true liberty,\nFor He is mine in truth.\n\nHe hath given me joy and His love as well,\nNow I feel it in me, yea I feel it within;\nAnd unto Him I would ever faithful be,\nAnd I will serve Him alone.\n\nHe keepeth me, ever He upholdeth me faithful,\nBecause I am His,\nBecause I am His;\nI also would shine as a radiant light,\nAnd give praise to my Jesus."
  },
  "447": {
    "title": "Be Ye Blessed Today",
    "lyrics": "Be ye blessed today\nIn the name of the Lord,\nAll who come praying with gladness,\nAll who come singing\nWith fervor and cheer,\nBe ye blessed of Christ the Lord.\n\nCHORUS: Yea, be ye blessed,\nBe ye blessed today,\nMay peace rule within your heart;\nYea, be ye blessed,\nBe ye blessed today,\nBy the hand of the Lord.\n\nThose who enter today\nThis sacred house of prayer,\nThirst in their soul for great gladness;\nFor in Christ the Lord\nFull forgiveness they'll find,\nA resting place of peace and love.\n\nA home without equal\nAwaits them in love,\nWhere united together we'll sing;\nWhere the Spirit of God\nMay be felt in our midst;\nCome today with fervent love."
  },
  "448": {
    "title": "Happiness! Happiness!",
    "lyrics": "Happiness, happiness,\nOnly in Christ shall we find;\nAt the throne of the Lamb,\nIn mansions celestial above,\nHappiness exceeding great.\n\nCHORUS: Christ hath been present with us,\nJoy and freedom He doth give;\nA rich stream of blessings\nIn His people shall abound.\n\nIn Christ there is happiness,\nAnd though time is passing on,\nOver all He doth keep watch;\nPouring forth His blessings down,\nO what happiness divine!\n\nEven now the time doth pass,\nNothing now can make us fear;\nFor our Christ awaits us there\nIn His glory soon to come,\nFor our Christ shall come again!"
  },
  "449": {
    "title": "Come, Lord, O Christ, Come",
    "lyrics": "Come, Lord, O Christ, come,\nSend down today Thy Spirit\nUpon Thy congregation;\nCome, Lord Jesus, grant us of Thy light,\nDivine fire of consolation,\nGrant us today Thy blessing.\n\nCHORUS: Fire, baptism of love,\nEarnest of our redemption;\nIndelible seal of salvation,\nSeal today my heart.\n\nChrist, come without delay,\nSustain our waiting souls\nWith Thy Spirit and Thy truth;\nCome, Comforter, grant us of Thy love,\nFire, the bread of Christendom,\nGrant us joy and liberty.\n\nWithout ceasing, without ceasing;\nUnited we beseech Thee\nThat Thou come to make us glad;\nO what happiness! O what wondrous grace!\nAt the presence of the heavenly King\nHeavens, earth, and sea do quake."
  },
  "450": {
    "title": "We Are the Church of Christ",
    "lyrics": "We are the Church of Jesus Christ,\nThe testimony Jesus gives;\nWith signs that are proven true,\nSigns of His holiness.\n\nCHORUS: We are of Christ,\nWe are of Christ;\nI bear the mark\nOf holiness.\n\nThese signs shall surely be fulfilled\nIf thou believest in the Truth,\nAnd thou shalt speak with newer tongues,\nAnd nothing shall harm thee.\n\nThese signs shall surely be fulfilled\nWhen sickness falleth on our frame;\nWith earnest prayers and supplications\nThe Lord shall make me whole.\n\nCHORUS: (2):\nChrist maketh me whole;\nChrist maketh me whole;\nChrist maketh me whole\nFrom every ill."
  },
  "451": {
    "title": "Health",
    "lyrics": "Health to the Christian people,\nHealth from our glorious King!\nRejoice in heavenly blessings\nDescending today from above.\n\nCHORUS: Health to the people of God,\nBlessing and redemption sure;\nMighty protection from our God,\nFrom our eternal King.\n\nWhat glory for the Christian\nWho hath believed in God,\nAnd seeth the wondrous marvels\nPoured out by the Redeemer's hand.\n\nRecount in all the earth\nWhat God hath wrought in thee,\nThat He hath given thee life,\nAnd also full salvation.\n\nHealth we have possessed\nThrough our great Savior's love;\nGlory unto His holy name\nFor His protecting shield."
  },
  "452": {
    "title": "I Am Content Here",
    "lyrics": "I am content, here on this earth\nWith a lowly cottage of little worth,\nYet in heaven where holy angels sing,\nA mansion glorious I long to possess.\n\nCHORUS: A mansion I desire\nYonder in heaven,\nWhere purest gold\nAbundantly flows;\nOne day very soon\nI'll be with my Christ,\nWalking the streets\nOf clearest crystal.\n\nHere often tempted, many trials bearing,\nYet I am not alone,\nAt my side standeth God.\nI am a pilgrim with no lasting home,\nYet there I possess a celestial mansion.\n\nHere am I poor, yet am I not sad,\nFor I seek that city so fair;\nThere with my Christ I have a great treasure,\nAnd a crown of eternal life.\n\nI am so joyful and truly content,\nBecause Jesus Christ my soul hath redeemed;\nHe filled all my life with His Holy Spirit,\nO hallelujah is my song!"
  },
  "453": {
    "title": "Now Is the Time to Meditate",
    "lyrics": "Now is the time to meditate\nOn all the time that hath been lost;\nIn mortal slumber life was spent,\nNow is the time to awake.\n\nCHORUS: Now is the time that thou awake,\nNow is the time to labor on;\nToday is the time to be strong,\nStrive thou to keep thy salvation.\n\nLazaruses sleeping in your tombs,\nHearken to the voice of Jesus Christ;\nGod would no longer see you asleep:\nLazarus, come forth! saith God.\n\nStrifes and jealousies, anger and contention,\nAre the dark mantle of sinners,\nCovering them beneath their tents\nFor dwelling in that low estate.\n\nNow is the time to mourn and lament,\nFor many blessings have been lost;\nAll this time in deepest poverty,\nFor sleeping that most fatal sleep.\n\nThe light of noonday shines on us,\nThis is the hour to labor on;\nLet none sleep longer in their tombs,\nNow is the time to awake."
  },
  "454": {
    "title": "The Great Sign",
    "lyrics": "The great sign art thou,\nO bride of the Lamb,\nAnd the woman chosen and faithful;\nWhom the sun doth enlighten,\nWith the moon beneath thy feet,\nAdorned in thy holy raiment,\nGiving glory unto God.\n\nCHORUS: Let us give glory and hallelujah,\nFor His power and His virtue,\nTo the Lamb celestial:\nGlory, hallelujah to Him!\n\nThe spoken against art thou,\nO Church of the Lord,\nThou who art marked in the heart\nWith the Spirit of God;\nGlory, glory, hallelujah to the Lord;\nTo the Lamb that was slain,\nHallelujah to Him!\n\nThou, the perfect one of God,\nWith thy crown of beauty,\nOf twelve stars shining bright\nUpon thy pathway, O woman;\nTwelve stones chosen of God\nAre the twelve foundations\nOf the New Jerusalem.\n\nThou, woman of the mighty God,\nWhom the Lamb doth illuminate;\nThou art clothed with Christ,\nFilled with holiness;\nThe Lamb is the light within thee,\nBlessed among the maidens,\nChosen of God!"
  },
  "455": {
    "title": "In an Upper Room",
    "lyrics": "Within an upper room on high,\nWith one accord and fervor,\nA hundred and twenty waited\nFor the promise of the Lord.\n\nCHORUS: /:/ God, send Thy mighty power /:/\nTo every waiting heart.\n\nWith a rushing sound from heaven\nCame the mighty power down;\nAll of them were baptized\nWith the Holy Spirit divine.\n\nThis same ancient, mighty power\nIs the faithful heavenly gift,\nPromised unto all believers\nOf a lowly, humble heart.\n\nGod is even now restoring\nThat great day of Pentecost,\nAnd the Spirit all His gifts\nDoth distribute once again.\n\nNow the Spirit of all grace,\nWhich our Jesus hath bestowed,\nDoth reveal to us the triumph\nOf the One who rose again."
  },
  "456": {
    "title": "O How Rich Is the Christian",
    "lyrics": "O how rich is the Christian\nWhen he follows Christ so faithful;\nRiches are within his hand,\nBecause Christ abides with him.\n\nCHORUS: O how rich shall everyone be,\nO how rich 'tis to dwell with Him;\nA treasure supreme is to be\nA faithful one of Christ.\n\nGold and silver are not riches,\nFor they surely pass away;\nRich is he that hath the Savior\nAnd abideth in His love.\n\nNever have I in this world desired\nTo be rich in earthly store;\nI have longed to be made wealthy in the kingdom\nCelestial."
  },
  "457": {
    "title": "When I Behold the Clouds",
    "lyrics": "When I behold the clouds I wonder\nWhich of them all it shall be\nThat shall bring my Redeemer down;\nAmid all the great multitudes\nWhich of them all it shall be,\nWhich shall it be? O, on which shall He come?\nFor so He promised us.\n\nCHORUS: Amid clouds He shall come,\nAmid great multitudes\nOf angels who to Him shall sing\nPraises without ceasing.\n\nLike the lightning Christ shall show Himself\nWith great and mighty power;\nIn the heavens He shall appear,\nAnd amid the clouds of heaven\nEvery eye shall behold Him then,\nFor He shall come, yea He shall come\nWith omnipotence and majesty.\n\nMy desire is to await Him,\nWatching and praying in faith,\nFor so He commanded us;\nAnd upon the clouds of heaven He shall come\nWith great majesty and power,\nTo bear away those whom He saved:\n'Tis the promise of our God."
  },
  "458": {
    "title": "Through a Testimony",
    "lyrics": "Through a testimony that I heard,\nMy soul in Christ believed;\nI was seeking the light of my Savior,\nWandering lost in the world and in error,\nMy soul heard the words that he spoke.\n\nCHORUS: \"The peace of the Lord,\"\nThus he greeted us; of many wonders\nThere he spake to us;\nHe said that he was once lost,\nYet Christ found him;\nAnd through those words my soul then heard,\nIt also did rejoice.\n\nIn that very moment I perceived\nThat I was dead in sin,\nWithout God, without light,\nWithout my Savior.\n\nThen I resolved to do the same\nAs he who spake to me;\nI cried unto the Savior,\nAnd He answered me.\n\nThose words that he then spake\nMade me to understand\nThat even as he had been,\nSo was I found;\nThen I resolved to leave all vice\nAnd every evil way;\nThen I believed in my Savior."
  },
  "459": {
    "title": "The Evil Times",
    "lyrics": "The evil times are come at last,\nA sign that Christ shall soon return;\nLet us work deeds of holiness,\nAnd we shall reach our glorious King.\n\nCHORUS: O my God, O my King,\nO my Helper near,\nMy trust I place in Thy holy love;\nO my God, O my King, O my Helper near,\nIn Thy holy name\nShall the sinner overcome.\n\nMen seek to follow after sin\nBecause they have not the Lord Jehovah;\nThey have embraced ungodliness,\nAnd in their malice they shall perish.\n\nPerils immense that compass us round\nWould take away our liberty;\nYet stronger still doth the Church remain,\nWith Jesus Christ her Captain true.\n\nTake courage, brother, cast out fear,\nPress boldly onward in the fight;\nLook to the Lamb who hath ascended on high\nTo bear thee to eternity."
  },
  "460": {
    "title": "Evil World",
    "lyrics": "Evil world, deceitful and full of sin,\nIgnorance and error,\nMy soul shall return no more to serve thee;\nI depart from thee without grief.\n\nCHORUS: My Lord alone gave me liberty\nFrom this evil world that did\nDeceive me;\nWith its vanity it shattered my soul,\nYet Jesus Christ redemption gave to me.\n\nThe sins that in thee I committed,\nJesus Christ hath forgiven them all;\nMine offenses He hath cast into oblivion,\nWhich He remembereth nevermore.\n\nI depart from thee, evil world;\nNevermore shalt thou see me again\nCommitting sin in my life;\nTo deceit I cannot return."
  },
  "461": {
    "title": "I Have a Friend",
    "lyrics": "I have a friend most faithful,\nHis name is Jesus,\nWho never forsaketh me;\nAlways at my side I bear Him with me,\nBecause He is my friend\nAnd gentle Shepherd.\n\nCHORUS: /:/ How good He is, /:/\nMy blessed Jesus!\nHis tender voice\nGiveth me courage,\nAnd soon I shall be where He is.\n\nI cannot remain\nSilent within this flock,\nFor I feel within my soul,\nThe Holy Spirit.\nOf the living God,\nWho dwelleth in the heavens\nThroughout eternity.\n\nHoly Lamb of God,\nMy heart is filled with joy,\nBeholding Thy blessed grace\nWhich Thou didst pour out\nUpon this Thy servant,\nWho liveth in gladness and giveth Thee praise."
  },
  "462": {
    "title": "Sound the Trumpets",
    "lyrics": "Let the trumpets sound in the third heaven,\nAnd the multitudes are singing now;\nFor all the valiant saints are passing by,\nWho on earth loved the Lord Jesus.\n\nCHORUS: No, no, no, no, no, no, no,\nI would not be parted from Him;\nNo, no, no, no, no, no, no,\nI shall never cease to love Him;\nHis great love He showed to me,\nWhen He came to save me;\nNo, no, no, no, no, no, no,\nNever can they part me from Him.\n\nWise virgins are all His Church,\nOf Jesus the Christ, our Good Shepherd,\nFor she hath oil and burning lamps,\nFor she waiteth for her Saviour.\n\nOthers who mournfully walk weeping,\nLamenting a grievous pain;\nFor the Judge divine with fingers of fire,\nDenied them entrance into Zion fair.\n\nWhich of these art thou: of those who rejoice,\nOr of those who suffer separation?\nIf thou wouldst rejoice, thou must strive onward,\nLaboring ever for thine own salvation."
  },
  "463": {
    "title": "Leave Me Not, Lord, I Pray Thee",
    "lyrics": "My diseased soul, my anguished being,\nAre left far behind me, O Lord;\nYet I forget not that I was wretched,\nWithout comfort, without faith, and without love.\nToday I recall the life in darkness\nThat I lived without Thee, my Lord;\nYet one day Thou didst pay for my guilt,\nAnd didst bear on the cross all my pain.\n\nCHORUS: Leave me not, Lord, I pray Thee,\nLeave me not, Lord, I implore;\nI am so lacking, so frail, so weak,\nThat I might betray Thee, O Lord.\nImpossible to forget the moments\nI spent near to Thee in prayer;\nImpossible to forget Thou art good,\nAnd that Thou watchest over my soul, Lord.\n\nInconstant I walked in Thy pathway;\nOfttimes did I sin in my pride;\nAnd without Christ I was blind and foolish,\nAnd turned my foot from Thy way.\nThou didst humble me sorely, my God;\nOnly thus did I lose my vain strife;\nFor at last I resolved to obey Thee,\nAnd surrendered my heart unto Thee.\n\nNow I live meditating on Thy grace,\nI feel in my soul Thy sweet warmth;\nThy pardon hath blotted out my misery,\nThy blood and Thy love reached to me.\nToday I desire only to serve Thee,\nAnd to please Thee for evermore,\nAnd in silence, my Christ, to implore Thee:\nTake not Thy voice from my soul."
  },
  "464": {
    "title": "A Timely Message",
    "lyrics": "A message in season\nThe Saviour sendeth thee today,\nFor He desireth not to see thee perish;\nTherefore He speaketh to thee in love.\n\nCHORUS: This divine message,\nThis is a timely warning:\n/:/ If thou savest not thy life this night,\nTomorrow thou shalt be dead. /:/\n\nGod hath never desired\nThe vile death of the sinner;\nTherefore Christ hath come down\nTo save him by His love.\n\nChrist hath come down,\nAnd maketh the sinner to live,\nSending him a timely message,\nAnd thus delivereth him from death."
  },
  "465": {
    "title": "Give Thanks unto the Lord",
    "lyrics": "Give thanks unto the Lord,\nGive thanks for all His love;\nLet praises resound\nUnto the Creator.\n\nCHORUS: Thanksgiving\nWe bring to Thee today,\nUnto Thee, unto Thee, my God.\n\nAbundant thanks let us give today,\nAbundant thanks to the Creator;\nHe is worthy of our songs\nOf praise.\n\nThanks, thanks, O holy God,\nThanks, thanks, Good Shepherd;\nThy flock Thou hast shepherded\nWith love."
  },
  "466": {
    "title": "With Gratitude",
    "lyrics": "With gratitude... I sing today,\nUnto my Lord Jesus, the God of love...\nFor He delivered me... from perdition...\nAnd hath brought me unto His fold,\nTo grant me salvation.\n\nCHORUS: Unto the God of Abraham,\nOf Jacob and Isaac,\nUnto the God of great goodness,\nFor He came to save me;\nUnto Him be all the honor,\nThe glory and dominion,\nFrom now and forever, amen,\nYea... throughout all eternity.\n\nI feel within... my heart...\nThe Holy Spirit of the Saviour;\nHe is the One who... giveth me strength...\nThat I may follow with faith\nThe way of holiness.\n\nGrant unto me... O Lord Jesus,\nTo arrive yonder with Thee, in Thy mansion;\nI long to see... Thy gentle face,\nAnd to gaze upon Thee with love,\nAnd sing unto Thee with great fervor."
  },
  "467": {
    "title": "Messengers",
    "lyrics": "Messengers who of Christ the Saviour\nGo sowing the word of love,\nWho strive on the field without fear,\nOvercoming the tempter's power.\n\nCHORUS: Welcome, ye messengers,\nIn the name of Christ the Lord;\nWelcome, ye sowers,\nUnto this House of Prayer.\n\nValiant, holy servants of Jesus,\nWho cease not to impart to us His light,\nWho gladly partake of His cross,\nWelcome, holy servants of Jesus.\n\nMany trials await them round about:\nHunger, death, nakedness, persecution;\nAll suffer for the cause of the Lord;\nGo forward, holy servants, in love.\n\nThou art reaching the goal, O sower,\nFinishing thy course as thou pressest on;\nThou art drawing near; holy servant, take courage,\nJesus Christ shall give thee thy reward."
  },
  "468": {
    "title": "As When the Rain Descends",
    "lyrics": "As when the rain descendeth,\nAnd moisteneth the fertile earth,\nEven so hath Christ come down,\nTo impart unto me His tender grace.\n\nCHORUS: What joy, what joy,\nWhat great joy I feel now\nHere within my heart!\nFor Christ hath flooded\nMy poor soul with a Comforter divine.\n\nWhen I wandered lost in the world,\nHaving none in whom to take refuge,\nIt was then that my blessed Jesus\nCame swiftly to gather me in.\n\nNow I see how great is the bliss\nWhich Jesus, the King of heaven,\nHath bestowed, though I am unworthy;\nUnto His name be given the glory!"
  },
  "469": {
    "title": "In Bethlehem the Voice Was Heard",
    "lyrics": "In Bethlehem the voice was heard\nThat the Saviour is born;\nFor we have seen His star,\nIn the east it hath appeared;\nFor unto us is born\nIn the city of Bethlehem,\nA Child is born unto us,\nHe is the Holy One of Israel.\n\nCHORUS: Hallelujah, glory to the King of Zion!\nHallelujah, for His blessing!\nGlory in the highest,\nAnd on earth peace;\nGlory and hallelujahs\nUnto the heavenly Lamb!\n\nThe shepherds ceaselessly\nWatching over the flock,\nSaw the wondrous light,\nAnd were filled with fear;\nYet the voice of the angel\nGave them consolation,\nSaying unto them: Fear not,\nFor the Saviour is born.\n\nNow the Saviour is born;\nSing, all ye, with one voice:\nGlory, hallelujah, for His love,\nFor He saved the sinner;\nBecause He hath brought us\nGlad tidings of salvation;\nGlory and hallelujahs\nUnto Jesus, the Good Shepherd!"
  },
  "470": {
    "title": "When My Steps Draw Near",
    "lyrics": "Joyful am I when my footsteps arrive\nAt this fair house of prayer,\nFor my Christ by His great power\nTeacheth me what my portion is.\n\nCHORUS: In Christ is my portion,\nMy mansion is with Him.\nI grieve not that I came;\nFull joyful am I with my King.\n\nDay by day I come full joyful,\nI come to surrender my heart unto Christ;\nI come seeking holy communion,\nAnd from my brethren charity and love.\n\nSweet moments I spend in prayer,\nAnd beauteous hymns breathe their fragrance round,\nMy soul rejoiceth in the preaching;\nAll is a great spiritual joy."
  },
  "471": {
    "title": "Christians, Let Us All March Onward",
    "lyrics": "Christians, let us all march onward\nTo the fray with fervent courage;\nHelped by Christ, let us triumph,\nFighting treacherous sin.\n\nCHORUS: Fight on... fight on...\nThy crown surely awaiteth thee\nIn heaven, with Christ the Lord /:/\n\nLet us all take up our armor\n'Gainst the fierce and subtle tempter,\nWith courage setting free the souls\nFrom the heavy, oppressive yoke.\n\nLead ye those who are groping,\nSeeking after a worldly god;\nOffer ye to their hungry souls\nThe precious spiritual manna.\n\nYours shall be the victory,\nFearing not fierce Satan;\nFor Jesus awaiteth you in His glory,\nGracious to reward your toil.\n\nThe doctrine of Christ with zeal\nProclaim ye, spreading abroad the light,\nAnd await your reward in heaven\nFrom the Shepherd of shepherds, Jesus."
  },
  "472": {
    "title": "In My Soul I Have Peace",
    "lyrics": "Within my soul I have peace,\nA heavenly peace,\nWhich the world cannot take away;\nIn the grievous trial\nOr in the mortal strife,\nI have peace ineffable and peerless.\n\nCHORUS: Within my soul dwelleth\nChrist the Lord;\nWithin my soul He dwelleth;\nOh, what love!\nHe forsaketh me never,\nFor faithfully He promiseth,\nThat forever\nHe will go with me,\nChrist my Saviour.\n\nWhen I came unto Jesus,\nI found abundant light,\nHis peace flooded my soul;\nSorrow ended and night passed away,\nBecause Christ Jesus saved me.\n\nThis peerless peace that delivereth me from evil,\nSublime, without equal, eternal,\nI will not forsake, for it shall lead me\nTo mine eternal heavenly mansion."
  },
  "473": {
    "title": "I Feel So Joyful",
    "lyrics": "I feel so joyful,\nEven as the day when I heard\nThe gentle voice of God,\nGlory to Him!\nWhen they told me of Christ,\nMy soul felt great rejoicing;\nBlessed be the Lord!\n\nCHORUS: I am joyful in my Jesus,\nHallelujah, glory to Him!\nOpen your lips, O brethren,\nLet us sing with great rejoicing;\nLet us say: Glory to God!\n\nUnto my sorrowful home there came\nA messenger of Jesus Christ,\nAsking my ear that I might hear\nThat message divine,\nWords of everlasting life,\nAnd I received them.\n\nUnto the temple he led me,\nAnd I beheld with wonder;\nI was moved to tears as I heard;\nThose precious hymns\nReached to the depths of my soul,\nAnd at last I repented."
  },
  "474": {
    "title": "Cruel Are the Thorns Along the Way",
    "lyrics": "Most cruel are the thorns along the way,\nFull oft we feel their bitterness and pain;\nThey teach the pilgrim in this passing world\nThat earth can never be our lasting home.\n\nCHORUS: If on a steep path thou art walking,\nFear not, God shall help thee;\nIf the world instead of roses\nGiveth thee thorns,\nChrist ever with His love shall help thee.\n\nOur struggles often work for our good,\nCausing our hearts toward heaven to sigh;\nOur soul would fain break through every strife,\nTriumphantly soaring unto the heights.\n\nThough tempests beat upon our journey,\nAfter the storms the calm shall come;\nWhat matter though distress be ever near?\nThe hand of the Lord shall uphold us.\n\nWithin the power of God is strength divine,\nTo bear the cross with all humility;\nGod saith His grace shall be enough for us,\nIn every trial and in deepest need."
  },
  "475": {
    "title": "Sin Wounded Me",
    "lyrics": "Sin wounded me, I went to Jesus,\nI showed to Him my grief;\nLost, wandering, I beheld His light,\nHe blessed me in His love.\n\nCHORUS: At the cross, at the cross,\n'Twas where Jesus died,\nAnd the stains of my soul\nHe washed clean, He washed clean;\n'Twas there by faith,\nWhere I looked upon Jesus,\nAnd ever joyful with Him am I.\n\nUpon a cross my blessed Lord\nPoured out His precious blood,\nFor this poor sinner in his need,\nWhom thus He came to save.\n\nHe conquered death with mighty power,\nAnd rose to heaven on high;\nTo trust in Him is my delight,\nI have no fear to die.\n\nThough He departed, I am not alone,\nHe sent the Comforter;\nDivine the love that unto me\nShowed Jesus, Saviour mine."
  },
  "476": {
    "title": "Nothing Afflicts Me",
    "lyrics": "Nothing afflicteth me like knowing\nThat Jesus Christ is coming again,\nAnd that I lack preparation;\nOh, what sorrow 'twill be if I am left behind!\n\nCHORUS: If Christ cometh,\nOh, what great grief!\nFor him who liveth\nIn condemnation.\nDelay Thy journey, O my Lord;\nI promise Thee to strive the more.\n\nA sorrow do I feel within my soul,\nFinding myself so lacking in faith;\nIf Christ cometh, woe is me!\nOh, what sorrow 'twill be if I am left behind!\n\nOne hope do I hold within my soul,\nAnd it is to strive as I ought;\nIf I do not, woe is me!\nOh, what sorrow 'twill be if I am left behind!"
  },
  "477": {
    "title": "I Desire to Serve the Lord",
    "lyrics": "Unto the Lord I desire to give service,\nFor I know that He can save me;\nYea, He promiseth to take me to dwell\nWhere I ever may behold Him.\n\nCHORUS: I am fighting the battle, Lord,\nI will finish my course unto the end;\nYea, I also am keeping the faith;\nI but wait for Thee to come and bear me home.\n\nAll that I must suffer here\nCannot be compared at all\nWith the glory which Christ, when He cometh,\nUnto His people shall surely give.\n\nWith those who possess no faith,\nIn the world I must contend,\nThat, being born of God,\nThe evil one may not overcome me.\n\nThe crown of righteousness already is\nPrepared for him who striveth to the end,\nWhich the Lord, the righteous Judge, shall give me\nOn the day when He shall come."
  },
  "478": {
    "title": "Hearken to This Sweet Story",
    "lyrics": "Hearken to this sweet story\nOf Him who came from glory,\nTo redeem and save,\nAnd life unto the world to give;\nHe through His goodness delivereth me\nFrom misery and condemnation;\nHallelujah, Christ hath saved me!\n\nCHORUS: Hallelujah, for in His name\nHe can grant salvation unto man,\nRaising him from sin and wickedness;\nGlory to Christ!\nToday I tell the sweet story,\nI sing glory, glory, glory,\nHallelujah, Christ hath saved me!\n\nFrom the pit of sin,\nTo grant me His riches, Christ brought me forth;\nHe made my footsteps straight;\nBy His blood I was redeemed,\nAnd I feel my life transformed;\nHallelujah, Christ hath saved me!\n\nOh, blessed and sweet story:\nFrom His throne of glory\nChrist came down below,\nEven to rescue me!\nI am a trophy of His grace;\nHis power hath redeemed me;\nHallelujah, Christ hath saved me!\n\nYonder with exceeding joy,\nIn that wondrous place on high,\nWith my Christ above,\nWhere in glory He abides,\nI shall sing through all the ages\nOf His greatness and His truth;\nHallelujah, Christ hath saved me!"
  },
  "479": {
    "title": "I Long to See Jesus Christ",
    "lyrics": "I long to see Jesus Christ,\nMy beloved Saviour;\nI long to see highest heaven,\nTo behold the throne of the Lord;\nTo see the face of my Master,\nWho suffered for me on the cross;\nI shall dwell in that homeland\nOf everlasting joy and light.\n\nCHORUS: I long to see that fair land,\nWhere eternal love doth reign;\nI long to be in the mansions\nOf Jesus my Saviour.\n\nI long to see Jesus Christ\nWithout reserve of my love;\nI desire to be a messenger,\nLeading the sinner\nTo the cross of Jesus Christ\nAnd to the heavenly homeland,\nWhere I may dwell forevermore\nWith the angelic choir.\n\nThrough the redeeming work\nOf Jesus my Saviour,\nI shall live throughout the ages,\nWhere I may enjoy His love;\nBy the blood of the Lamb,\nThough unworthy I know I am,\nWith the host of the redeemed,\nPraises unto the Lord I give."
  },
  "480": {
    "title": "What Glory It Is to Say",
    "lyrics": "What glory it is to say\nThat Jesus hath saved me,\nFor truly I speak the truth;\nI tell it again that Jesus alone saved me,\nAnd this is the truth indeed.\n\nCHORUS: The death of Christ\nWas my salvation,\nHis death took away my grief;\nAll of my sins\nHe hath forgiven,\nMy soul is made glad in Jesus.\n\nThe life that I have\nI owe unto Jesus,\nAnd I speak that which is the truth;\nI bless His name with deep devotion\nThroughout all eternity.\n\nThe joy that I feel Jesus gave unto me,\nMy cup is running over;\nHe blotted out my sins,\nHe took away my grief,\nToday I rejoice in liberty."
  },
  "481": {
    "title": "In the Business of the King",
    "lyrics": "In the business of the King, Jehovah,\nIt is meet that we should labor,\nIt is meet that we should labor,\nPreaching the truth.\n\nCHORUS: Labor in the Lord\nIs labor of great worth;\nLet us labor more and more,\nLet us labor in love.\n\nIn the spiritual work\nIt is meet that we should labor,\nIt is meet that we should labor,\nProclaiming liberty.\n\nThe world liveth without holiness,\nIt is meet that we should labor,\nIt is meet that we should labor,\nIn the name of Jehovah."
  },
  "482": {
    "title": "I Am a Pilgrim",
    "lyrics": "I am a pilgrim here\nIn this sorrowful world,\nI have no home wherein to dwell;\nI walk along with\nMany a hardship,\nBut in heaven is my home.\n\nCHORUS: I must strive to have my home\nWith Jesus my King;\nI must suffer that I may rejoice.\nA crown is waiting\nYonder in heaven,\nWhich, if I be faithful,\nI must surely win.\n\nWinter and tempest\nBeat upon my life,\nOh, what pain, what grievous pain!\nSore wearied I go\nAnd filled with bitterness,\nAll to behold my Savior.\n\nIn the midst of my sorrow\nI feel the love of Christ,\nWhich maketh me love Him more and more;\nIt is a blessing\nTo bear the cross of Christ,\n'Tis the glory of my life."
  },
  "483": {
    "title": "Let Heavenly Fire Come",
    "lyrics": "Let heavenly fire come,\nAnd preside o'er the assembly\nOf the people of the Lord;\n/:/ Let the fire come /:/\nTo the spiritual assembly.\n\nCHORUS: Holy fire of God,\nCome to this gathering,\nDescend today here\nWith heavenly power.\n\nGod answered by fire\nUnto the prophet Elijah,\nWhen he prayed unto God;\n/:/ Let fire come /:/\nToday we seek blessing.\n\nLet heavenly fire come,\nAnd consume the offering\nThat is upon the altar;\n/:/ Let fire come /:/\nTo the spiritual feast."
  },
  "484": {
    "title": "Jesus Gave unto My Life",
    "lyrics": "Jesus gave unto my life\nA hope that changed my whole being;\nHe saved my soul by His blessed grace,\nHe chose me that I might fulfill His will.\n\nCHORUS: Naught is more noble,\nNaught is more worthy,\nThan to consecrate to Jesus Christ\nOur lives;\nSorrows and thorns upon my way,\nYet sanctifieth me\nHis blessed presence.\n\nI understand, yea, what it costs\nTo follow the steps of Jesus in His labor;\nYet what care I? I will press on\nWith Christ before me,\nAnd by His grace I shall be more than conqueror.\n\nWith a thousand lives I could not repay\nWhat Thy love on Calvary did for me;\nMy life and faith are surrendered to Thy service,\nAs an offering\nConsecrated unto Thee alone.\n\nMy whole life I consecrate to Thy service,\nMy precious Savior;\nHereafter my brow shall wear a laurel of glory,\nFor every soul that I rescue through Thy love."
  },
  "485": {
    "title": "I Await the Victory",
    "lyrics": "I await the victory\nOf Jesus my Savior;\nI run in the stadium\nTo obtain a prize.\nI await the victory\nIn the name of the Lord;\nThough it cost me my life,\nI shall behold Christ the King.\n\nCHORUS: But I trust in God\nThat naught shall befall me,\nFor Christ defendeth me\nAnd never will forsake me.\n\nI hope to go to heaven\nAnd behold my Savior,\nAnd join with the righteous\nWho have been faithful unto Him.\nThough I suffer for the cause\nOf Jesus my Savior,\nI shall behold my Master\nIn His glory and majesty.\n\nThe way unto heaven\nIs of trials and pain;\nThe valiant press forward\nFor the kingdom of the Lord.\nThough it cost us our life,\nLet us not look behind;\nWe will press ever onward\nToward the heavenly mark."
  },
  "486": {
    "title": "Jesus Christ Invites Us",
    "lyrics": "Jesus Christ invites us\nUnto the kingdom of His love,\nWhere the radiant countenance of the Lord\nShineth brighter than the sun.\n\nCHORUS: Come, come, come, sinner,\nCome, come, come unto the Lord,\nTo partake of love and virtue.\n\nAt the throne of the Lamb\nThere is joy without equal;\nMany angels sing without ceasing\nUnto the heavenly Father.\n\nGreat joy is in store\nFor the sinful man\nWho draweth near in repentance to the Creator,\nTo yield Him his heart."
  },
  "487": {
    "title": "I Have Joy, Joy",
    "lyrics": "I have joy, joy\nIn my heart,\nIn my heart,\nIn my heart.\nI have joy, joy\nIn my heart,\nGlory be unto our God.\n\nI have joy,\nPeace and gladness in my heart,\nIn my heart, in my heart.\nI have peace and gladness, in my heart,\nGlory be unto our God.\n\nI have Christ,\nChrist within my heart,\nIn my heart, in my heart,\nI have Christ,\nChrist within my heart,\nGlory be unto our God."
  },
  "488": {
    "title": "I Would Speak to You",
    "lyrics": "I would tell you of the love of Christ,\nFor in Him I found a friend both strong and true;\nBy His grace He transformed my whole life,\nAll that in this life I am, I owe to Him.\n\nCHORUS: No one could ever love me like Christ,\nIncomparable is His friendship;\nHe alone could redeem me from sin,\nThrough His love and His goodness.\n\nMy soul was full of woes and sorrow,\nFilled it was with misery and grief;\nWith tenderness Christ reached out His hand,\nAnd guided me along the path of love.\n\nEvery day He comes to give me new strength,\nTo my heart He imparteth sweet peace;\nI shall not fathom why He came to save me,\nUntil in heaven I behold His face."
  },
  "489": {
    "title": "There Is No Fear",
    "lyrics": "There is no fear,\nJesus took it away;\nThere is no fear,\nJesus hath set me free;\nThere is no fear,\nJesus is my trust;\nThere is no fear,\nJesus is my Shepherd.\n\nCHORUS: Christ Jesus is a friend forever,\nChrist Jesus never will leave me,\nJesus alone is all in all to me,\nHis love shall ever uphold me.\n\nUpon a cross Jesus forgave me;\nUpon a cross,\nHis blood He shed;\nUpon a cross,\nJesus blotted out my guilt;\nUpon a cross,\nJesus died for me.\n\nFountain of love,\nForever Christ is;\nFountain of love,\nThat taketh away my pain;\nFountain of love,\nThat taketh away my sorrows;\nFountain of love,\nThat filleth the heart.\n\nGlory to Jesus,\nFor His divine love;\nGlory to Jesus,\nThroughout eternity.\nGlory to Jesus,\nFor His tender mercy;\nGlory to Jesus,\nOur blessed God."
  },
  "490": {
    "title": "My Righteousness in the Heavens",
    "lyrics": "/:/ My righteousness is in the heavens, /:/\nAnd from thence it shall come to me;\n/:/ If in this world I have no shelter, /:/\nThe testimony of God shall have it.\n\nCHORUS: We must wait\nUpon the justice of God;\nWe are not alone here upon the earth;\nOur refuge is Jehovah.\n\n/:/ The sorrows that rise in the soul /:/\nChrist can take away;\n/:/ It mattereth not that they be grievous, /:/\nThe testimony of God I shall have.\n\n/:/ In the Christian life there is suffering, /:/\nYet for a life to come;\n/:/ If Jesus Christ suffered for my sake, /:/\nThen why should I not also suffer?"
  },
  "491": {
    "title": "My Soul, Like a Ship",
    "lyrics": "My soul, like a ship,\nIs seen rowing upon the waters,\nAgainst the winds of a cruel tempest...\nAnd though the strength of my soul seemeth\nTo fail,\nJesus the Master cometh to my aid,\nAnd causeth me to triumph.\n\nCHORUS: Christ saith unto me:\nI am with thee,\nI will never leave thee,\nI will ever defend thee;\nKeep rowing onward,\nAnd thou shalt triumph by faith.\n\nMy soul, like a bruised reed, is seen to bend,\nAnd seemeth now about to break;\nYet the grace of Christ is seen to shine,\nAnd is poured forth like myrrh upon my soul,\nAnd causeth me to triumph.\n\nMy soul, like a bird that fleeth from its hunter,\nTo be delivered from bondage,\nSo in all things my soul crieth unto Jesus,\nWho by His grace sustaineth my soul,\nAnd causeth me to triumph."
  },
  "492": {
    "title": "My Beloved Cometh",
    "lyrics": "My Beloved cometh upon the mountains,\nGo ye forth to meet Him,\nAnd give Him welcome,\nAnd declare unto Him with joy\nYour gratitude,\n\nCHORUS: Blessed King that cometh,\nHosanna in the highest!\nMy Beloved cometh in the clouds,\nHe cometh for me, oh, what glory!\n\nKeep your lamps trimmed and burning,\nAnd pray without ceasing,\nAnointing your souls\nWith the excellent ointment\nOf the Comforter.\n\nIn the fulness of glory cometh\nMy beloved Jesus Christ,\nWith palms and crowns,\nFor the beloved children,\nThe workmanship of His love."
  },
  "493": {
    "title": "Glory to Thee, Jesus Divine",
    "lyrics": "Glory to Thee, Jesus divine,\nGlory to Thee for Thy goodness,\nGlory eternal to Thy tender mercies,\nDearest Savior.\n\nCHORUS: Glory, glory, hallelujah,\nGlory, glory, hallelujah, glory,\nGlory, hallelujah to our Savior.\n\nThou didst love me with tenderness,\nAnd for me on the cross Thou diedst,\nWith tenderness Thou didst cherish me,\nDearest Savior.\n\nI have faith only in Thy death,\nFor thereby Thou didst save me,\nEverlasting life Thou boughtest for me,\nDearest Savior.\n\nWe shall see Thee in Thy kingdom,\nWe shall go to dwell with Thee,\nIn Thy presence we shall rejoice,\nDearest Savior.\n\nTake courage, Christian courage,\nChrist is thy best Friend;\nHe will take thee unto Himself,\nJesus is thy Shepherd."
  },
  "494": {
    "title": "When the Trumpet Sounds",
    "lyrics": "When the trumpet of the Lord sounds\nIn that final, solemn day,\nAnd the eternal dawn shall break in radiant light;\nWhen the nations of the saved\nReach their homeland over there,\nAnd the roll is called up yonder, I'll be there.\n\nCHORUS: /:/ When the roll is called up yonder, /:/\nTo my name I gladly will respond.\n\nOn that day devoid of shadows,\nWhen no death shall ever be,\nAnd His glory the Savior shall impart;\nWhen the called ones shall enter\nUnto their celestial home,\nAnd the roll is called up yonder, I'll be there.\n\nLet us labor for the Master\nFrom the dawning's early gleam;\nLet us ever speak His love and faithful care;\nWhen all earthly things shall perish,\nAnd our labor cease below,\nAnd the roll is called up yonder, I'll be there."
  },
  "495": {
    "title": "The Chosen of the Lord",
    "lyrics": "The chosen of the Lord\nGo swiftly forth to fight,\nFor they follow the Shepherd,\nThe heavenly Lamb as their General.\n\nCHORUS: Strive on, strive on,\nOvercoming evil with good,\nAnd God shall grant us a home.\n\nFaithful soldiers of the Creator,\nFight on without fainting,\nBattling without ceasing,\nBattling with courage until ye triumph.\n\nWith the divine Emmanuel,\nNaught shall we lack;\nWith His weapons of truth\nNew strength He will grant us\nTo overcome."
  },
  "496": {
    "title": "Held by the Hand",
    "lyrics": "Held by the hand of my Lord,\nI will walk trusting and without any fear;\nHeld by His hand I will not fear,\nBecause in His holy name\nI shall overcome.\n\nCHORUS: If Christ goeth with me I will follow on,\nHeld by His hand I never shall fall;\nFor His holy hand is mighty in power,\nAnd the world I shall overcome.\n\nIn the narrow way I will walk;\nMy Savior saith unto me: I will help thee;\nThe King in His beauty I shall behold,\nUnto eternal rest I shall attain.\n\nIf Christ protect me faithful I will be,\nThe world and its pleasures I will cast away;\nYet without Jesus Christ I can do nothing,\nBut with His holy help\nI shall triumph."
  },
  "497": {
    "title": "There Is a Good Seed",
    "lyrics": "There is a good seed\nThat sprang up at the dawn,\nIt fell into good ground\nAnd straightway it could grow;\nI am a seed of Christ,\nWhom He chose by His power;\nIf my Lord help me,\nI also shall be able to grow.\n\nCHORUS: Leave me not, O Lord,\nFor I would be faithful unto Thee;\nUnto the place whence I came forth,\nI nevermore would return;\nRemember me this day,\nSuffer me not to perish.\n\nThere was also the seed\nThat sprang up in stony ground;\nIt sprang up in a moment,\nYet it could not grow;\nBeneath the heat of the dawn\nIt began to wither away;\nLeave me not, O Lord,\nLest in like manner I perish.\n\nCause me to grow in Thy vineyard,\nThat my fruit may abound;\nI would follow in Thy way,\nGrant me Thy grace, O Lord.\nI long to feel in my soul\nThat Thou helpest me to overcome;\nLeave me not, O Lord,\nGrant me ever Thy power."
  },
  "498": {
    "title": "Jesus Is My Sovereign King",
    "lyrics": "Jesus is my sovereign King,\nMy joy is to sing forth His praise;\nHe is King, yet He views me as a brother,\nHe is King, and He imparts to me His love;\nLeaving His throne of glory,\nHe came to lift me from the mire,\nAnd I am happy, yea, I am happy in Him.\n\nJesus is my longed-for Friend,\nAnd in darkness or light He ever goeth;\nPatient and humble at my side,\nHis help and consolation He giveth me;\nTherefore steadfastly I follow Him,\nBecause He is my King and my Friend,\nAnd I am happy.\n\nLord, what could I ever give Thee\nFor so great goodness unto me?\nIs it enough to serve Thee and love Thee?\nIs yielding myself unto Thee all?\nThen accept Thou my life,\nWhich unto Thee alone is surrendered;\nFor I am happy,\nYea, I am happy in Thee."
  },
  "499": {
    "title": "Christ Gives Us Light",
    "lyrics": "Christ giveth us light,\nWith His holy majesty;\nChrist giveth us light\nWith His gracious hand.\n\nCHORUS: He is the light, He is the light,\nMy Jesus is the light;\nFear ye not, for with you walketh\nHe who died upon the cross.\n\nWe shall not stumble,\nFor our Shepherd goeth before,\nEver lighting\nOur footsteps with His love.\n\nHe is the Light of the world,\nOur holy Savior;\nHe is the light that illumineth\nWhosoever seeketh salvation."
  },
  "500": {
    "title": "God Be with You",
    "lyrics": "God be with you in His holy love,\nTill the day when we arrive\nAt the homeland where we shall dwell,\nForever with the Savior.\n\nCHORUS: At the coming of Jesus we shall meet,\nAt the feet of our Savior;\nGathered together we all shall be,\nOne fold with our Good Shepherd.\n\nGod be with you in His holy love;\nIn the perilous pathway\nOf this tempestuous life,\nMay He keep you in peace and without fear.\n\nGod be with you in His holy love;\nMay His banner guide you on,\nAnd exceedingly strengthen you,\nWith His Spirit, the Comforter.\n\nGod be with you in His holy love;\nWith His grace may He uphold you,\nTill the Master shall come\nTo establish His kingdom in splendor."
  },
  "501": {
    "title": "The Divine Physician",
    "lyrics": "The Divine Physician is healing every ill,\nHe healeth the body\nAnd blotteth out iniquity.\n\nCHORUS: Draw near, draw near unto the altar,\nContrite and humble,\nAnd God shall heal thee.\n\nThe holy Wonder-worker is the celestial Lamb,\nHe is able to heal thee\nOf every disease.\n\nSick was I in soul\nAnd body, and the Creator\nHath granted me life;\nHow good is the Lord!"
  },
  "502": {
    "title": "To the King of Kings",
    "lyrics": "To the King of kings, Jehovah the glorious,\nLet us sing with joy in holy communion;\nWith great reverence let us come before Him,\nHis name let us exalt with all our heart.\n\nCHORUS: Joy and peace dwell within my heart,\nHis grace hath saved me and assured my salvation;\n'Tis my longing to serve my Lord,\nHis will to fulfill and for Him\nEver to live; oh, what sweet\nHope doth encourage us to pursue\nThe path which the Master marked out for us\nWith His example here;\nYonder in the distance at the end of our toil,\nWe shall render praises unto our Savior.\n\nThe King of kings, Jesus the loving Lord,\nSublime and triumphant shall return to the world;\nWith all His saints with joyful songs,\nHis longing church unto Him shall be joined.\n\nThe Holy Spirit, faithful and blessed,\nOh, let us welcome the heavenly Guest;\nAnd with His presence, virtue, and power,\nSickness, sin, and all evil shall end.\n\nUnto God only wise and omnipotent,\nLet all reverently give honor and majesty;\nFor Thy benefits, graciously receive\nMy humble service, O blessed God Jehovah."
  },
  "503": {
    "title": "Christ Hath Delivered Me",
    "lyrics": "Christ hath delivered me\nFrom error and wickedness;\nHis love hath comforted me,\nHe telleth me the truth.\n\nCHORUS: I desire to follow Christ,\nThat I may attain\nUnto the heavenly mansion\nWhich He went to prepare.\n\nJesus giveth me life\nBy His mighty power;\nHis sheltering hand\nShall help me overcome.\n\nChrist is my fortress,\nMy beloved Savior;\nIn my tribulations\nHe is my Savior."
  },
  "504": {
    "title": "Preach the Gospel",
    "lyrics": "Preach the gospel of the Lord,\nPreach ye, preach ye,\nTo the lost one who, wandering in error,\nSeeketh peace and liberty.\n\nCHORUS: Preach ye, preach ye, preach ye\nJesus the Lord, and tell that soon\nHe will return to bear away those whom He saved.\n\nThrough the valleys and the mountains preach\nJesus the Lord,\nProclaiming that He giveth us salvation;\nPreach ye with fervent love.\n\nPreach that Jesus Christ shall come again,\nWith celestial power,\nAnd His faithful redeemed\nHe will take to His kingdom to rest."
  },
  "505": {
    "title": "So Sweet the Name of Jesus",
    "lyrics": "So sweet the name of Jesus,\nIts lovely notes when sung,\nWhich my soul feeleth when proclaiming:\nThe name of Jesus!\n\nCHORUS: Christ, oh, how sweet He is!\nChrist, forever the same is He,\nChrist, Thee will I acclaim,\nForever, O my Christ!\n\nI adore the name of Jesus,\nNever shall His love fail me,\nAnd it setteth aside my sorrow:\nThe name of Jesus!\n\nSo pure the name of Jesus,\nWhich could take away my grief,\nAnd grant sweet peace unto my soul:\nThe name of Jesus!\n\nThe sweet name of Jesus\nForever I desire to praise,\nAnd all men ought to magnify:\nThe name of Jesus!"
  },
  "506": {
    "title": "O Homeland of the Soul",
    "lyrics": "O homeland of the soul, which in vision I behold,\nIts shining walls of jasper and crystal;\nNigh draweth the great day of Christ,\nWhen with the archangel's voice to that homeland I shall go.\n\nCHORUS: Glory, glory to our God,\nGlory, glory to our God,\nThe joy of the Christian;\nGlory, glory to our God,\nGlory, glory to our God,\nLet us praise our Lord.\n\nWe are journeying on to that beautiful home,\nWhere we shall meet Jesus the King;\nFor He went to prepare us a heavenly home,\nWhere we shall dwell for all eternity.\n\nForsake thy way, O sinful man,\nToday Christ offereth full salvation;\nBehold there the blood\nWhich He shed on the cross\nTo redeem the chief of sinners.\n\nO happy home where we shall dwell,\nPraising Christ, my good Savior;\nBeholding there His face so full of love,\nMy soul shall rejoice, singing unto the Lord.\n\nThe tree of life that bloometh there,\nWhere floweth the river of jasper and crystal;\nGod hath promised that to eat He shall give\nUnto those who shall walk in holiness."
  },
  "507": {
    "title": "If Sorrowful in Soul Thou Art",
    "lyrics": "If thou art sorrowful in soul,\nAnd art a slave to sin,\nChrist alone loveth thee,\nAnd fain would set thee free.\n\nCHORUS: Liberty, liberty, liberty,\nIs found only believing in Jesus;\nAnd if He maketh us free indeed,\nTo Him be the glory, to Him gratitude.\nLiberty, liberty, liberty,\nOf the souls that hearken to His voice;\nAnd in His grace He will keep us now\nAs the chosen people of God.\n\nIf thou dost wander through the world,\nSeeking some ideal,\nChrist alone is the One\nWhom thou canst receive.\n\nIf thou desirest in this life\nSublime joy and peace,\nChrist alone doth bestow\nA sweet well-being.\n\nIf thou wouldst go to heaven,\nForever there to rejoice,\nOnly"
  },
  "508": {
    "title": "Holy Book, by God Inspired",
    "lyrics": "Holy Book, by God inspired,\nFountain of eternal truths,\nThou hast come to break the chains\nOf sin, ignorance, and fear.\nThou dost tell us of royal mansions,\nOf a happy destiny beyond;\nPlainly to our sight thou revealest\nWhat to the saint his God shall give.\n\nPerfect is the divine commandment,\nRightly it guideth the souls of men;\nUnto the lowly whom thou lovest so well,\nThy precepts cause him to grow.\nPerfect peace and joy thou hast given\nTo the mortal who drank of thy streams;\nAn immortal reward hath attained\nHe who faithfully kept His command.\n\nKeep shining evermore in the world,\nFor millions know not thy light;\nAnd that at last of thine influence they may taste,\nThrough the world I will spread thee abroad.\nBlessed God, clear my understanding,\nTo behold Thy perfect truth;\nGrant that I keep it forever obedient,\nPraising Thine exalted goodness."
  },
  "509": {
    "title": "I Lifted Up Mine Eyes to Heaven",
    "lyrics": "I lifted up mine eyes to heaven,\nAnd saw Thy light descend;\nAnd I said: What is man,\nThat Thou shouldst offer him Thy cross?\nI merit not this grace,\nDepart from me, O Lord;\nSo great is my misery,\nThat unworthy am I of Thee.\n\nCHORUS: /:/ Unworthy am I of Thee /:/\nYet Thou didst love me so,\nThat Thou didst die for me /:/\n\nMy body was so stricken,\nMy spirit sick as well;\nDeep sunken in misery,\nDrinking of bitter gall;\nYet Thine immense compassion\nTransformed my wretched life.\n/:/ Thou hadst on me compassion,\nAnd now I am so blest. /:/\n\nNow made whole and safe,\nI have no further need;\nI only yearn to see Thee,\nAnd gaze upon Thy face,\nTo surrender at Thy feet,\nTo look on Thee yet more.\n/:/ To lean upon Thy bosom,\nForever and evermore. /:/"
  },
  "510": {
    "title": "Sing Them Over Again to Me",
    "lyrics": "Oh, sing them over again to me,\nBeautiful words of life;\nIn them find I my joy and light,\nBeautiful words of life;\nYea, of light and life,\nThey are support and guide.\n/:/ How beautiful, how beautiful,\nBeautiful words of life! /:/\n\nJesus Christ unto all doth give\nBeautiful words of life;\nHear them today, O sinner,\nBeautiful words of life.\nIn His mercy He saves thee,\nTo His church He calls thee,\n/:/ How beautiful, how beautiful,\nBeautiful words of life! /:/\n\nSweet the song shall resound afar,\nBeautiful words of life;\nThy sins He will forgive,\nBeautiful words of life;\nYea, of light and life,\nThey are support and guide.\n/:/ How beautiful, how beautiful,\nBeautiful words of life! /:/"
  },
  "511": {
    "title": "The Righteous Cried",
    "lyrics": "The righteous cried aloud,\nAnd Jehovah heard,\nAnd from their afflictions\nHe delivered them,\nHe delivered them.\n\nCHORUS: The righteous shall flourish\nEven as the palm tree;\nIn the house of Jehovah,\nIn the courts\nOf our God,\nHe shall grow and flourish.\n\nIn everlasting remembrance\nThe righteous shall be,\nAnd of evil tidings\nHe shall have no fear;\nTrust thou in Jehovah.\n\nThe righteous give praise\nUnto the Lord Jehovah,\nAnd all that are upright\nWith Him shall dwell,\nWith Him shall dwell.\n\nThe righteous by grace,\nBy faith he shall live,\nAnd for his righteousness\nJehovah keepeth him\nAnd will exalt him."
  },
  "512": {
    "title": "Let Us Go to the House of Jehovah",
    "lyrics": "Let us go to the house of Jehovah,\nIn the morning hours\nTo bless our God;\nCome, O my brethren,\nCome, all united, and let us give glory to God.\n\nCHORUS: How good is the morning prayer,\nWherein our soul rejoiceth,\nHow good it is;\nThe Lord receiveth it\nAnd His angels rejoice,\nHow sweet it is, how sweet it is,\nHow good it is,\nThe prayer of the morning.\n\nLay thy petitions before the Lord,\nIn the morning in prayer,\nAnd thou shalt have the answer,\nLikewise the recompense\nFrom Christ the Redeemer.\n\nCome in the morning unto prayer,\nAnd ask of Christ His protection;\nLay before Him thy labors and thy necessities,\nAnd He will help thee."
  },
  "513": {
    "title": "Of the Holy Love of Christ",
    "lyrics": "Of the holy love of Christ,\nWhich hath no equal known,\nOf His divine sweet grace,\nSublime, eternal shown;\nOf His tender mercy boundless as the sea\nAnd high as the heavens,\nWith gladness I will sing.\n\nCHORUS: The love of my Lord,\nGreater and sweeter evermore,\nRich, ineffable, nothing can compare,\nThe love of my Jesus.\n\nWhen He lived here in the world,\nThe people followed Him,\nAnd all their heavy griefs\nUpon Him did they lay;\nThen in His loving-kindness\nHis love gushed forth a stream,\nUnbounded and immense,\nHealing every ill.\n\nHe gave unto the blind man's eyes\nA new and wondrous light,\nThe eternal light of life\nWhich gleameth from the cross;\nAnd He gave to human souls\nAll the glory of His being,\nImparting by His grace\nHis Spirit and His power.\n\nHis love through all the ages\nOf the world is as a beacon,\nWhich marketh out in splendor\nThe high and holy way;\nAnd with the passing years,\nHe will make it sweeter still,\nMore precious, as He giveth\nHis peerless peace unto the soul."
  },
  "514": {
    "title": "I Have Nothing",
    "lyrics": "I have nothing that is pleasing to my Lord;\nAll hath He wrought by His love and compassion,\nIn His great majesty, He forgot me not.\n\nCHORUS: I love Christ because He first loved me,\nI love Christ because He hath lifted me up,\nAnd if I live, I shall live unto His honor.\n\nI was wandering astray and far from the Savior,\nKnowing Him not, nor what He wrought for my sake;\nOh, how wondrous was the love of the Savior.\n\nAnd thou, what hast thou made of thy life until now?\nDost thou seek Christ with a sincere heart?\nCome, He calleth thee; and in Me thou shalt rest."
  },
  "515": {
    "title": "Enter Ye In at the Strait Gate",
    "lyrics": "Enter ye in at the strait gate,\nEnter, enter ye in;\nThrough it the righteous shall enter\nInto the heavenly kingdom.\n\nCHORUS: The way that leadeth unto life\nIs narrow and one's own;\nWhosoever would enter the kingdom\nMust forsake all wickedness,\nIf he would enter\nWhere Jesus is.\n\nNarrow is the pathway,\nEnter, enter ye in;\nThere the redeemed shall enter\nInto the heavenly kingdom.\n\nIf thou wouldst enter the kingdom,\nThou must forsake... forsake...\nThe vices of this world\nWhich work perdition."
  },
  "516": {
    "title": "Heaven Is Thy Holy Throne",
    "lyrics": "Heaven is Thy holy throne,\nAnd the earth is the footstool of Thy feet;\nAll things are in Thy presence,\nThou beholdest all, O righteous Judge.\n\nCHORUS: Who can hide himself from Thee, O Lord?\nFrom Thy presence flee away and escape,\nWhether in darkness or in light,\nUnto Thee all is the same.\n\nThere is none that can hide himself,\nA place where Thou seest not, nor art present;\nAll things are in Thy presence,\nThou beholdest all, O righteous Judge.\n\nThere is none that can deceive Thee,\nFor Thou knowest all things, O righteous Judge;\nAll things are in Thy presence,\nFrom heaven Thou beholdest all."
  },
  "517": {
    "title": "Where Is the Work of Satan?",
    "lyrics": "Where is the work of Satan?\nIt hath been destroyed\nBy Jesus the Captain;\nHis mighty power hath overcome;\nGlory be to Jesus Christ,\nWho gave us His protection.\n\nCHORUS: A fierce tempest beat upon\nOur spiritual vessel,\nYet Jesus with authority\nRebuked the winds,\nAnd all was calm.\n\nLegions sought to destroy\nWith offensive weapons the church of the Lord;\nYet there is power in God,\nWith His glorious right hand\nHe vanquished the enemy.\n\nUnto God be praise and every blessing,\nFor He showed forth His grace\nIn the great tribulation;\nJehovah hath delivered us,\nTherefore we sing unto Him\nWith love and with delight."
  },
  "518": {
    "title": "My Petition Unto God",
    "lyrics": "Heavenly Father,\nO Lamb that wast slain,\nUnto Thee we come, O Lord;\nHear our supplications which we make unto Thee,\nAnd keep us in Thy love.\n\nCHORUS: Grant that all of us\nMay be obedient\nUnto Thy watchmen,\nWhom Thou hast appointed,\nO blessed God of love.\n\nAll this flock doth promise to obey Thee,\nAnd Thine apostles sent forth, O Lord;\nSpeak through Thy servants,\nWe will hearken,\nAnd we will do Thy will.\n\nReveal all the ministries, O Lord,\nUnto Thy prophets, O my God;\nMy soul doth hunger and thirst after righteousness,\nWith Thee it longeth to dwell."
  },
  "519": {
    "title": "Arise, O Daughter of Zion",
    "lyrics": "Arise, O daughter of Zion,\nThe Beloved desireth to hear thy voice;\nBreathe forth thy sweet perfumes today,\nGo, hasten, present unto thy Beloved the very best.\n\nCHORUS: Oh, come unto me, faithful Beloved,\nCome unto me and I will give thee my love;\nLet us go forth unto the hedgerows,\nAnd I will render praise unto thee.\n\nArise, O daughter of Zion,\nIn the morning come unto prayer;\nSurrender unto Him all thy heart,\nPray, sing the new song of redemption.\n\nEven as a honeycomb of rich honey\nIs the melody of thy sweet speech;\nGlorious bride of the Good Shepherd,\nSoon, together and with Him, forever shalt thou reign."
  },
  "520": {
    "title": "All Praise to Thee, My God, This Night",
    "lyrics": "All praise to Thee, my God, this night,\nFor all the blessings of this day;\nOh, keep me, and let Thy mighty grace\nBe evermore the sure defense of mine.\n\nCHORUS: For all the faults that I this day have done,\nForgive me, Lord, for Thy beloved Son;\nWith Thee, and with my neighbor, and myself,\nMay I, ere sleep, be fully reconciled.\n\nTeach me to live, that I may dread\nThe grave no more than this my bed of rest;\nGrant me to die with blessed hope steadfast,\nOne day to wake in likeness of my Lord.\n\nO may my soul in Thee find sweet repose,\nAnd gentle slumber mine eyelids close;\nA sleep that may new vigor give to me,\nTo serve Thee upon waking, O my Lord."
  },
  "521": {
    "title": "My Redeemer",
    "lyrics": "My Redeemer died upon the cross,\nFor sinners all He fully paid;\nWhoso receives Him shall have the light,\nTheir iniquities Jesus hath forgiven.\n\nCHORUS: When God beholds the blood\nWhich His own Son hath shed,\nWherein the sinner hath\nBeen washed, He shall behold with love.\n\nThe chiefest sinners He will save,\nEven as He promised, He will do;\nTrust thou in Him, O sinner, now,\nAnd life eternal the Lord doth give.\n\nJudgment is coming, thou shalt be there;\nIf thou reject it, thou shalt be lost;\nTarry no longer, come unto Jesus,\nWho bore thy sins upon the cross.\n\nO wondrous marvel of matchless love,\nWhich Christ hath shown to the sinner lost!\nWhosoever believeth saved shall be,\nEternal joys he shall ever taste."
  },
  "522": {
    "title": "To Calvary Alone Jesus Ascended",
    "lyrics": "To Calvary alone Jesus ascended,\nBearing a heavy cross,\nAnd dying upon it, to mortal man He left\nA beacon of glorious light.\n\nCHORUS: /:/ Jesus alone will guide me /:/\nTo my home of peace and eternal love;\nJesus alone will guide me.\n\nIn Jesus alone shall man ever find\nThe fountain of inspiration;\nNaught great and worthy in the world shall be\nThat in Jesus findeth not approval.\n\nThrough Him I shall go to His kingdom to reign,\nThe pathway is clearly marked;\nIn my darkened life He shall be the beacon,\nAnd unto His light my soul shall ever go."
  },
  "523": {
    "title": "Be Ye Valiant, All Ye Christians",
    "lyrics": "Be ye valiant, all ye Christians,\nLaboring in the heavenly work;\n/:/ Your endeavors shall win the victory,\nThe banner ye must never lower /:/\n\nCHORUS: Someday we shall see, O brethren,\nChorus: crowned our grand ideal;\nSpread abroad throughout all our land,\nThe great Christian work celestial.\n\n'Tis in vain that barriers are set for us\nBy the legions marshaled by Satan;\n/:/ We will run with great joy the heavenly race,\nWith Christ, the illustrious General /:/\n\nNot a tear shall dim our eyes,\nNot a murmur shall hush our voice;\n/:/ We will fight with all fervent zeal,\nWarring against the hosts of Satan /:/\n\nForward march, ye valiant ones assembled,\nPreparing for the final day;\n/:/ Bringing to Christ the souls that are lost,\nWe shall triumph in glorious Canaan /:/"
  },
  "524": {
    "title": "Sweet Moments of Consolation",
    "lyrics": "Sweet moments of consolation,\nWhich I spend beside the cross;\nThere, suffering cruel pain and grief,\nI behold the Lamb, Christ Jesus.\n\nI behold His arms of love outspread,\nInviting me to come to Him;\nAnd making all my faults His own,\nFor me His lips do taste the gall.\n\nFrom His deep wounds a living fountain\nOf purest blood I see flow forth;\nAnd sprinkling o'er my sinful brow,\nIt washeth all my guilt away.\n\nI see His anguish now is ended,\nMade the offering of atonement;\nHis noble brow bowed low and faint,\nAnd my redemption is fulfilled.\n\nSweet moments, rich in precious gifts,\nOf peace and grace, of life and light;\nThere's comfort and true blessing found\nNear unto Christ, beside the cross."
  },
  "525": {
    "title": "Though in Anguish I May Be",
    "lyrics": "Though in affliction I find myself,\nMy bounden duty shall ever be to walk,\nAlways trusting in Christ my Lord,\n/:/ Who giveth me liberty /:/\nAnd imparteth unto me His love,\nThat I may be an overcomer.\n\nCHORUS: I shall overcome, I shall overcome in Jesus Christ my King,\nThrough Jesus Christ my King,\nI am going to overcome the tempter,\nAnd my whole being shall shine,\nWith my Lord,\nAnd it shall shine within my soul,\nFull of holy courage,\nBecause I am prepared\nTo press onward.\n\nWhen sin would tempt and entice me,\nMy bounden duty shall ever be to shun\nEvery danger that may exist,\n/:/ And that might trouble me /:/\nAnd turn me away from the Lord;\nYet unto this day, I am an overcomer.\n\nThrough love we boldly defy\nThe power of evil,\nAnd every false way,\nThrough the doctrine of Christ,\nWhich maketh me an overcomer;\nIt is a lamp unto my path,\nIt is substance spiritual,\nTo win the heavenly prize."
  },
  "526": {
    "title": "Jesus Is Praying to the Father",
    "lyrics": "Praying unto the Father is Jesus,\nSuffering in Gethsemane;\nAnd upon His radiant countenance,\nSweat as of blood ye shall behold.\n\nCHORUS: Gethsemane, profound remembrance,\nGethsemane! O wondrous place,\nThere I behold upon His knees,\nThe eternal Son of my God.\n\nThe soul of my blessed Jesus\nIs sorrowful even unto death,\nDrinking the bitter cup of grief,\nIn order to save the sinner.\n\nIn the judgment hall He hath peace,\nThough scourged with fierce cruelty;\nAnd a crown of sharpest thorns,\nMy Jesus weareth on His brow.\n\nNow they have nailed Him to the cross;\nBehold Him bleeding, sinner, see!\nFor thine iniquities He suffered\nCruel ignominy and grievous pain."
  },
  "527": {
    "title": "If Any Man Hath Understanding",
    "lyrics": "If any man hath understanding,\nHe shall find the foundation\nOf the Father, the Son, and the Spirit who is God;\nIf he hath revelation, he findeth the accord\nThat these three are one.\nWhile some do build upon the shifting sand,\nOthers upon the Rock, steadfast and eternal;\nSome believe the lie, others believe the truth;\nThe truth is found in Christ.\n\nCHORUS: Jesus is the truth,\nThe way and the light;\nHe is God, the fullness\nOf the great Godhead.\n\nSome accept the baptism which the Bible teacheth us,\nThe baptism of immersion;\nOthers, refusing righteousness, trust in the baptism of men\nAnd in their own tradition; Matthew twenty-eight, nineteen,\nChrist giveth the commandment\nOf the baptism which must be obeyed;\nTherefore the Apostle Peter,\nIn Acts two, thirty-eight, maketh it known unto us.\n\nThree witnesses in the Bible confirm unto us baptism\nIn the name of Jesus; three apostles of Christ,\nPeter, John, and also Paul, confirm unto us this light;\nThree witnesses in heaven bear one and the selfsame record:\nThe Father, the Word, and the Spirit who is God;\nAnd this glorious mystery John doth plainly declare to us,\nThat these three are one.\n\nThis One is Jesus Christ, Emmanuel, God with us,\nThe Everlasting Father, and the Prince of Peace;\nIn the beginning was the Word, and the Word was with God,\nAnd the Word was God. If any man hath understanding,\nHe shall find the foundation\nOf the Father, of the Son, and of the Spirit who is God;\nIf thou hast revelation, thou findest the accord\nThat these three, in one are..."
  },
  "528": {
    "title": "The Hope of Every Christian",
    "lyrics": "The hope of every Christian\nIs to enter with Christ into joy,\nIn the kingdom of light and of glory,\nWhere all of His children dwell.\n\nCHORUS: The mansions where He awaits us\nAre of life, and of joy, and of peace;\nWith His blood He came to purchase us,\nTo the faithful He promiseth aid.\n\nHow often have the faithful suffered,\nWho have kept their lives in His care;\nAnd their names have already been written\nIn His glorious book of life.\n\nIf thou wouldest strive, O Christian,\nAsk always for help from the Lord;\nBy His strength He will make thee a victor,\nIf thou sufferest, thou shalt have reward.\n\nHow blessed are all the brethren,\nWho keep themselves with Christ to the end;\nTheir mansions they shall see forever,\nIf they patiently suffer\nUnto the end."
  },
  "529": {
    "title": "Nor Silver Nor Gold",
    "lyrics": "Nor silver nor gold hath obtained my redemption,\nNor riches of earth could have saved my poor soul;\nThe blood of Christ was my only foundation,\n'Tis only through that He was able to save.\n\nCHORUS: He redeemed me, yet not with silver;\nThe Savior hath purchased my soul;\nNot with gold, but with His own blood,\nThe great price of His wondrous love.\n\nNor silver nor gold hath obtained my redemption,\nFor too heavy and great was my guilt;\nThe blood of Christ was my only ransom,\nThrough that alone pardon I found.\n\nNor silver nor gold hath obtained my redemption,\nWhile wandering far in grievous sin;\nThe blood of Christ was my only ransom,\nLove wondrous, sublime, and precious of God.\n\nNor silver nor gold hath obtained my redemption\nFrom the fear that I never could quell;\nThe blood of Christ was my only ransom,\nThrough that alone He could deliver my soul.\n\nNor silver nor gold hath obtained my redemption,\nEntrance into the kingdom they never can give;\nThe blood of Christ was my only ransom,\nThrough that alone He was able to buy."
  },
  "530": {
    "title": "My Jesus Ascended",
    "lyrics": "My Jesus ascended on high to dwell,\nRewards He went to prepare;\nAnd seated at the right hand He is\nOf the Father, and soon will return.\n\nCHORUS: Christ ascended on high to plead\nFor the poor sinner in need;\nHe intercedeth for His people from there,\nHe shall return to gather His flock,\nBecause we are truly His own.\n\nThou art the fountain of love,\nThou didst promise that dwelling up there,\nThou wouldest send forth the Comforter,\nTo abide with us here below.\n\nThou madest the lame to walk,\nThe deaf Thou didst cause to hear,\nAnd the dumb were enabled to speak,\nThou gavest sight to the blind as well.\n\nToday we give thanks unto Thee, O Lord,\nFor the wondrous display of Thy power;\nFor Thou art the One who healeth here,\nAnd who granteth forgiveness to souls."
  },
  "531": {
    "title": "Master of Galilee",
    "lyrics": "How good is the Master to me,\nWith what can I ever repay?\nWhen He saw me sailing adrift\nIn a world of wickedness,\nHe reached forth His holy hand,\nHe desired to rescue my soul.\n\nCHORUS: Master, O Master, Master of Galilee,\nThou didst see me shipwrecked afar,\nLike a vessel tossed on the sea;\nMaster, O Master, Master of Nazareth,\nForget not Thine own beloved,\nLeave them not to perish, Lord.\n\nHow good is Jesus Christ,\nNever shall I forget,\nWhen I had offended Him,\nHe looked not upon my sin;\nHe was very faithful to me,\nForgiving mine iniquity.\n\nMy life was already lost,\nThe enemy wounded my soul;\nYet the Good Samaritan,\nPassing by, found me there;\nHe reached forth His holy hand,\nAnd bound up my bleeding wounds.\n\nOnly I ask Thee, Master,\nThat Thou wouldest increase my faith,\nTo continue pressing ahead,\nEncouraging those who believe not;\nFor the time is drawing near,\nAnd the faith we must boldly proclaim."
  },
  "532": {
    "title": "There Is One Who Intercedes",
    "lyrics": "There is One who pleadeth for me in heaven,\nJesus, the loving and merciful Shepherd;\nHe guardeth my soul with tenderest care,\nWouldst thou make Him thy King and Lord?\n\nCHORUS: /: For you I am praying,\nFor you I am praying, for you I am praying,\nPraying for you :/\n\nA Father I have who hath granted to me\nA confident hope that the world cannot give;\nAnd soon He will give me a place in His kingdom,\nAnd I would that thou shouldst go with me as well.\n\nIn snow-white apparel I then shall be clothed,\nIn that new country with Christ my King;\nOh, would that I saw thee arrayed in His kingdom,\nWith those precious garments adorned as well!\n\nIn garments of white thou shalt surely be clothed,\nIf thou dost repent of all evil and sin;\nAnd if thou endurest, the crown shall be thine,\nThe King of all kings shall place it on thee."
  },
  "533": {
    "title": "A Bride Adorned I Behold",
    "lyrics": "A bride richly adorned I behold,\n'Tis the chosen Church of our God;\nIn the Bible we find her pattern,\nWho obeyeth the voice of Christ.\n\nCHORUS: In the clouds shall our journey be made,\nWhen Jesus returneth again;\nWhen the final trumpet shall sound,\nIn the skies we shall go to see Him.\n\nThere are some churches against her,\nFor they envy her glory and power;\nThey despise her because she is chosen,\nOf her name they will nothing know.\n\nChrist hath said: Ye shall be persecuted\nBy the world for My own sake;\nYet be of good cheer, I have overcome the world,\nAnd ye also shall overcome.\n\nNow I go to that homeland beloved,\nWhere Jesus prepareth a home for me;\nWouldest thou not come with me along,\nTo abide forever and evermore?"
  },
  "534": {
    "title": "I Look for That Day of Gladness",
    "lyrics": "I look for that glad day when Christ shall come again,\nFor He soon will return and will catch His bride away;\nOh, what rapture this blessed thought doth give my soul,\nThat my Christ is coming back to earth again!\n\nCHORUS: Oh! Jesus is coming to the world again, praise to God!\nYes, Jesus is coming to the world again, hallelujah!\nWe shall see Him in the clouds with the angels of light,\nWhen Christ shall come back to earth again.\n\nThe coming of Jesus will heal all the pain and grief\nWhich forever afflicts this poor world of sin below;\nEvery tear shall be wiped away by our Savior then,\nWhen Christ shall come back to earth again.\n\nThe Church shall reign in Zion with great joy eternal,\nAnd in all the holy mountain naught shall hurt or destroy;\nFor the knowledge of God shall fill every heart alike,\nWhen Christ shall come back to earth again.\n\nSin, sorrow, and death in this world below shall cease,\nMartyrs and saints with Jesus evermore shall reign;\nEvery soul shall possess perfect peace without care,\nWhen Christ shall come back to earth again."
  },
  "535": {
    "title": "Under the Olive Grove",
    "lyrics": "Under the stars of the night walked my Jesus,\nIn the garden of Gethsemane;\nWhere no light was found, Christ knelt on the ground,\nWhen He prayed 'neath the olive grove.\n\nCHORUS: 'Neath the olive grove, 'neath the olive grove,\nWent my Christ all alone to pray;\n\"O Heavenly Father, let Thy will be done!\"\nHe cried 'neath the olive grove.\n\nWhen He prayed to the Father He was sorrowful,\nBitter indeed was the cup He drank;\nThere came an angel from heaven and strengthened Him,\nWhen He prayed 'neath the olive grove.\n\nMay my song ever be of the love that He showed,\nMy Jesus, when praying in the garden there;\nGlory be given to Him, my guilt He bore,\nWhen He prayed 'neath the olive grove."
  },
  "536": {
    "title": "Never Be Afraid to Speak for Christ",
    "lyrics": "Never be afraid to speak for Christ,\nLet His light within thee shine;\nAlways confess Him who saved thy soul,\nAll to Jesus thou dost owe.\n\nCHORUS: Never be afraid, never be afraid,\nNever, never, never;\nHe is thy loving Savior,\nNever therefore be afraid.\n\nNever be afraid to work for Christ,\nWhatsoever lieth in thy power;\nLabor with love, with faith and constancy,\nAll thy toil He will reward.\n\nNever be afraid to suffer for Christ,\nBearing reproach or pain and grief;\nSuffer with love through all thy trials,\nEven as suffered thy Savior.\n\nNever be afraid to live for Christ,\nWay, truth, and life is He;\nHe will lead thee with tenderest care\nTo His heavenly garden fair."
  },
  "537": {
    "title": "Let Us Hasten Forward",
    "lyrics": "Let us hasten onward along the pathway\nWhich the divine Savior taught us to tread;\nLet us hear His word, pure and beautiful,\nWhich in His holy Gospel He left for us.\nLet us keep His commandments with steadfastness,\nCasting aside selfishness, hatred, and malice;\nLet us sing unto Jesus songs new and sweet,\nThankful and grateful with all of our heart.\n\nCHORUS: Alone in Thee is peace, O Redeemer,\nIn Thee is mercy and salvation,\nIn Thee is comfort,\nIn Thee is love, in Thee is goodness,\nIn Thee is forgiveness.\n\nLet us pray without ceasing by night and day,\nPraising the Divine Savior above;\nEntreating Him to preserve our lives,\nWithin His sacred wound in His holy love.\nBeseeching Him for sufficient strength,\nThat we may be able temptation to withstand;\nLet us sing unto Him different songs of praise,\nThankful and grateful with all of our heart.\n\nThe tempestuous winds of the evil one\nShall assail the believer in the Lord;\nYet he who obeyeth His holy word,\nThe victory shall have in his Savior.\nJesus is our refuge and our strength,\nAnd with Him we shall overcome the dragon;\nLet us press on our way with steadfastness,\nObeying the voice of the Redeemer."
  },
  "538": {
    "title": "Our Savior Is Coming Again",
    "lyrics": "Our Savior is coming to earth again,\nOh, what if it were today?\nComing to reign in power and love,\nOh, what if it were today?\nComing to claim His chosen bride,\nPurified in His wondrous love,\nOver the whole earth scattered wide,\nOh, what if it were today?\n\nCHORUS: Glory! Glory! Joy to us 'twill bring;\nGlory! Glory! Crown Him now as King;\nGlory! Glory! Haste, prepare the way;\nGlory! Glory! Christ will come again.\n\nThe power of Satan shall be no more,\nOh, that it were today!\nNo sorrow or sighing shall then be seen,\nOh, that it were today!\nAll of the dead in Christ shall rise,\nCaught up together by their Lord;\nWhen shall these glories appear to us?\nOh, that it were today!\n\nFaithful and true would He find us here,\nIf He should come today?\nWatching with gladness and perfect peace,\nIf He should come today?\nSigns of His coming now multiply,\nIn the east the morning light breaks forth;\nThe time is already drawing near,\nOh, that it were today!"
  },
  "539": {
    "title": "The Counsel of God",
    "lyrics": "The counsel of God is unto life,\nThe counsel of God is His commandments;\nTrust thou in Jesus at all times,\nAnd He shall give thee consolation and\nLife everlasting.\n\nCHORUS: Delight thyself also in the Lord,\nAnd He shall give thee the desires of thy soul;\nCome unto Jesus with all thine heart,\nCall evermore upon the Lord.\n\nWhen in deep sorrow thy soul is oppressed,\nThou shalt praise God through all thy life;\nWhen sorrow departeth and thou art glad,\nWait upon God with all thine heart at\nAll times.\n\nThou shalt praise God ever glad and rejoicing,\nNever forgetting His commandments;\nMercy and peace shall thy soul possess,\nWait upon God with all thine heart at\nAll times.\n\nWhen thou art in poverty and out of breath,\nThou shalt take up thy cross which God hath given;\nThe hope of the poor is Jesus Christ,\nWait upon God with all thine heart\nAt all times."
  },
  "540": {
    "title": "The Great Day Is Coming",
    "lyrics": "The great day is coming, very soon it cometh,\nThe great day of judgment shall come,\nWhen the righteous and wicked the Great Judge shall divide,\nWe await the final judgment day.\n\nCHORUS: /: Art thou ready? :/ Now the trumpet loud\nGiveth the sign;\n/: Art thou ready? :/ Waiting for the\nFinal judgment day.\n\nA sad day is coming, very soon it cometh,\nThe great day of final judgment,\nWhen the rebel people cast away shall then be,\nLet us wait for the final judgment day.\n\nThat great day is coming, very soon it cometh,\nWhen Christ shall descend in power.\nYet the joy is felt by the beloved of the Lord,\nLet us wait for our blessed Lord."
  },
  "541": {
    "title": "When I Come to the Palace",
    "lyrics": "When I come to the palace\nWhere my God doth dwell\nAnd I hear the anthems\nThat extol the King,\nI will also unite\nWith the choirs on high,\nAnd will bless His name and will sing to Him\nThrough all eternity.\n\nCHORUS: I will also sing\nAnd will give Him praise.\nIn the midst of the multitude,\nThey will all hear it then,\nAnd shall ask themselves:\n\"Who are these that sing to the King?\"\n'Tis the people of God\nWho were washed and cleansed\nIn the blood of Christ the Lord.\n\nWhen I come to the palace\nOf Christ Jesus my Lord,\nAnd behold on the Throne the sweet Lamb of God,\nI will also unite with the saints up there,\nI will also sing\nAnd will ever bless\nThe great name of my Lord.\n\nWhen I come to the palace\nWhere my God doth dwell\nAnd I hear the choirs\nThat are singing to Him,\nOvercome I shall stand\nWith a wonder profound,\nAnd anon they shall hear\nMy sweet song of love\nWhich I raise unto my Lord."
  },
  "542": {
    "title": "O How Hard Is This Saying",
    "lyrics": "O how hard is this word, Lord,\nWho can bear it, O Lord?\nFor I feel that it pierceth my very soul,\nAnd it penetrates deep in my innermost heart.\n\nCHORUS: Who can bear it, O Lord?\nWho can keep it, O Lord?\n'Tis a hard word to me, Thy true faithful word;\nIf Thou give me Thy power, Lord,\nIf Thou give me the faith as well,\nWell I know I shall overcome, for lo,\nThou alone art my helper, Lord.\n\nO how hard is this word, Lord,\nThat in hearing it I do feel\nThat perhaps I can never endure it here,\nBut my Christ will forever uphold my soul.\n\nWhat is impossible unto me,\nUnto my God shall never be.\nThere is naught left for me but to make my choice,\nThat I may perform all Thy holy will."
  },
  "543": {
    "title": "Day of Righteousness",
    "lyrics": "Day of righteousness we all await,\nWhen our mortal frames\nShall transformed be in light;\nChrist our blessed Savior\nIn His power shall bear us up\nTo His heavenly home of joy and peace.\n\nCHORUS: The good seed in peace that is sown below\nTo a blooming celestial bower shall change;\nAnd the Lord shall transform us in glory there\nTo a heavenly body of radiant light;\nWe shall see Him up there.\n\nWell I know my Redeemer forever lives,\nAnd upon the dust shall the King arise at last;\nAnd though broken be my skin,\nIn my flesh I shall see my God,\nWith mine eyes steadfast set on His wondrous power.\n\nOh that now my tender expressions might\nGraven be throughout all eternity,\nIn the books of the Lord Jehovah,\nThey can never forgotten be;\nThe remembrance of my name He will have on high."
  },
  "544": {
    "title": "Divine Companion",
    "lyrics": "Divine Companion on the pilgrim pathway,\nThy sweet presence do I feel as I journey on;\nIt hath driven away every gloom and shade,\nNow I feel the light, the blessed light of Thy love.\n\nCHORUS: Abide with me, Lord, for the day is waning,\nI offer Thee my heart to become Thine abode;\nMake it Thy enduring dwelling-place for aye,\nO accept it, accept it, my Savior blest.\n\nThe dark shade of the night is now drawing near,\nAnd therein the tempter in ambush will lie;\nLeave me not alone on the pathway here,\nHelp me, help me, O Lord, till I reach the goal.\n\nWith Thee the weary journey is rendered short,\nNeither thirst shall oppress nor the sun shall tire;\nIf the surging waves on the sea do rage,\nThou upon them in majesty wilt tread."
  },
  "545": {
    "title": "I Would Walk, O My Lord",
    "lyrics": "I would walk, O my Lord,\nIn Thy pathway of love,\nStriving onward yet more and more;\nEverywhere imparting\nGladness, comfort, and cheer,\nBeing filled with Thy goodness, Lord.\n\nCHORUS: Fill my pathway with love, O Lord, today,\nLet Thy Spirit direct my feet;\nAnd that ever in singing\nI be filled with Thy love,\nIn the way that I travel on.\n\nKeep me near unto Thee, O my Savior blest,\nSuffer never, ah never, that I should rove\nWithout light, without hope, or peace;\nFill my pathway with love today.\n\nThe brief journey of life soon shall reach its close,\nAnd no suffering shall be up there;\nHallelujah! while praising the Lord divine,\nFill my pathway with love today."
  },
  "546": {
    "title": "Sleeping by the Temple",
    "lyrics": "Near the temple slumbers a tender child,\nWho an offering pleasant of piety is,\nWhom his mother in holy devotion gave\nTo the service of the Lord.\n\nCHORUS: O Samuel, O Samuel!\nThus it spake to the faithful child;\nUnto Eli he goes and doth say, \"Here am I\";\n\"'Twas the Lord,\" Eli saith;\n\"If He call thee again, then say:\nSpeak, O Lord, speak quickly,\nFor Thy servant is listening now.\"\n\nMystically the lamp is still burning bright,\nStill and quiet the night lies all around,\nBut of a sudden a strange voice is heard,\nA mysterious, gentle voice.\n\nNow the Father beloved calleth once again,\nLet us give a prompt ear to His voice divine;\nLet each child say aloud, \"Speak, O Lord, I pray,\nFor I listen unto Thy voice.\"\n\nGod had chosen that pure and unblemished child,\nThat he wisely might govern in Israel,\nWith all righteousness, equity, and truth,\nAll the people of the Lord.\n\nCHORUS: By Thy grace, O my Lord,\nMake me grow in Thy holy love,\nThat I ever may serve\nWith my life till the very end.\nGrant me light, understanding,\nTruth, faith, and humility;\nMake an altar within my breast,\nAnd come therein to abide."
  },
  "547": {
    "title": "Angels Are Singing",
    "lyrics": "Angels are singing with sweetest voice,\nMortals are singing with resounding voice,\nChrist will be coming, our conquering King,\nChrist will be coming again.\n\nCHORUS: Coming again, coming again,\nIn glory coming to earth once again;\nComing again, coming again,\nHe cometh quickly to reign!\n\nSee on the earth, in the air and the sea,\nPortents tremendous fulfilled even now;\nAll things declaring that soon He will come,\nOur ever-glorious Lord.\n\nAll of the dead in the Lord shall arise\nOut of their graves, and with gladness shall go,\nMeeting their King and their Conqueror high,\nChrist will be coming again.\n\nCome in the clouds, O Thou Savior so blest!\nCome to the earth, O Thou glorious Lord!\nCome, for Thy church waits for Thee, O Lord Christ!\nChrist will be coming again."
  },
  "548": {
    "title": "Beloved Church",
    "lyrics": "Beloved church of Christ Jesus the Lord,\nEvery day do your spirits\nRejoice within,\nManifesting through Jesus Christ\nLife everlasting\nAnd salvation for human souls.\n\nCHORUS: /: The trumpet shall sound in Zion, :/ it shall sound :/\nThe trumpet shall sound in Zion,\nWhen the Savior shall appear.\n\nAll of the servants of Jesus Christ,\nAnd the assemblies that in His love\nAre gathered together,\nAll are awaiting the life eternal\nIn the mansions which the Lord hath\nPromised to give.\n\nWe testify that there is only joy,\nThat there is peace and salvation sure\nIn all our souls;\nAnd we shall conquer the enemy,\nFor Christ doth lead us in victory\nInto the fight."
  },
  "549": {
    "title": "Showers of Grace",
    "lyrics": "God hath bestowed us a promise:\n\"Showers of grace I will send;\nGifts that shall give you endurance,\nBountiful blessing I'll grant.\"\n\nCHORUS: Showers of grace,\nShowers we plead for, O Lord;\nSend us abundant outpourings,\nShowers of the Comforter blest.\n\nChrist gave to us the sweet promise\nOf the Holy Comforter;\nGrant unto us peace and purity,\nUnto His glory and praise.\n\nManifest, Lord, to the believer,\nAll of Thy love and Thy power;\nThou art the fountain of grace divine,\nFill all our being with peace.\n\nWork in Thy devout disciples,\nZeal, true devotion, and might,\nGiving us heavenly treasures,\nGifts of the Comforter blest."
  },
  "550": {
    "title": "How Many Mercies Do I Owe",
    "lyrics": "How many mercies do I owe to Jesus Christ,\nMany the miracles that He hath wrought for me;\nMany the wondrous works that He hath revealed\nIn the divine light of the Comforter.\n\nCHORUS: I will give praise to the Lamb of God,\nI will bless the Lord God of Israel;\nFor He is worthy of all the honor,\nOf all the glory and blessing and praise.\n\nHow many mercies do I owe to Jesus Christ,\nChrist loves my soul and provides me His defense;\nWell do I know I can never repay Him,\nFor Jesus Christ is my all in this life.\n\nHow many mercies do I owe to Jesus Christ,\nI have naught worthy to offer my Lord;\nOnly by grace hath He ransomed my spirit,\nAnd giveth solace deep into my heart."
  },
  "551": {
    "title": "Jesus Christ Is Our Guide",
    "lyrics": "Jesus Christ is our guide and our sure defense,\nGuided by Christ we have nothing to fear;\nPrecious the gifts He is granting this day\nUnto His children who dwell far and near.\nLet us strive onward to be of the chosen,\nThat we may dwell with Christ in that city bright;\nThere we shall wear the crown of life eternal,\nAnd ever rejoice with our Savior in light.\n\nJesus Christ is the great and transcendent light,\nAnd by His grace we are sunbeams below;\nAnd He desireth that we shine forth today\nAmid the shadows that encompass all;\nEverywhere into bright light He transformeth\nThe darksome depths, and the weary He calleth\nToday as well, and with open arms bids us,\nThat we may serve Him and Him alone.\n\nJesus Christ is the Judge divine and heavenly,\nAnd when He cometh, all things He shall judge;\nWherefore we ever must watch and be ready,\nDoing forever His most holy will;\nFor we know neither the day nor the hour\nWherein that Sovereign Leader shall return,\nAnd according to the deeds that we have done,\nAccording unto them shall He reward."
  },
  "552": {
    "title": "At the Break of Day",
    "lyrics": "At the break of day it may be Christ will come,\nWith a shout and the voice of the archangel;\nHe raiseth the dead, changeth them that are living,\nHis own He is coming to bear away.\n\nCHORUS: How long, O Lord Jesus?\nHow long till Thou come?\nChrist is coming, hallelujah!\nHallelujah, amen!\nHallelujah, amen!\n\nPerchance He will come\nWhen the day is declining;\nPerchance in the night\nHis glory will shine forth.\nTake courage, ye brethren,\nAnd let us be waiting:\nHis own He is coming to bear away.\n\nHis royal magnificence\nAnd glory we'll see;\nThe world and its sin,\nO brethren, let's leave.\nThus with great joy we shall welcome His presence,\nWhen Christ shall come taking us home to dwell.\n\nCHORUS: He that shall come will come,\nAnd will not delay;\nHe comes quickly, hallelujah!\nHallelujah, amen!\nHallelujah, amen!"
  },
  "553": {
    "title": "The Man Who Builds With Christ",
    "lyrics": "The man who builds his life upon Christ Jesus,\nMust have within his soul a righteous change;\nForsaking all deceit and bitter malice,\nTobacco and the cup of drunkenness.\n\nCHORUS: Teach me, O Lord, to walk in Thine obedience,\nFor I would upright be, O blessed Lord;\nLet not my sinful flesh betray my spirit,\nSuffer me not to fall in tempting snare.\n\nOn Monday when from labor thou returnest,\nWeary thou art and laden down with pain,\nAnd all the remainder of the evening\nThou sittest still before the television.\n\nOn Sunday when thou comest to the church house,\nThou dost forget the offering of the Lord,\nSaying \"Glory to God\" and \"Hallelujah!\",\nSeeking to hide thine imperfection there.\n\nO brother, if thou seekest to deceive thee,\nSeeking to hide thine imperfection still,\nIn truth thou dost appear before the church-doors\nUpon the Sunday by mistake alone."
  },
  "554": {
    "title": "A Thousand Questions",
    "lyrics": "A thousand questions worldly folk will ask us,\nTo see in whom our faith is placed,\nAnd who our God may be;\nAnd we, with words convincing and assured,\nShall render them our answer:\n\"Our God truly lives!\"\n\nCHORUS: And our God dwells high in the heavens,\nAll that He hath pleased He hath done;\nAnd He imparts to us His comfort,\nHis righteous statutes and His holy laws.\n\nMany souls by evil ways misled,\nAfter false idols ever wander on;\nAnd stirred with bitter jealousy will ask\nOf them that belong to Christ:\n\"Where is now their God?\"\n\nThere are many who live in ignorance,\nThat our God is great and gracious to forgive;\nAnd blinded in their minds, they live denying,\nAnd ever asking where their God may be."
  },
  "555": {
    "title": "I Was Found",
    "lyrics": "I was found even thus,\nIn that wilderness far away;\nA good Shepherd sought after me,\nHe thought of the sheep that went astray.\nI was not a sheep of His fold,\nYet He sought for that which was lost.\nHungry and thirsty He saw me,\nAnd had compassion on me,\nAnd brought me into His sheepfold.\n\nCHORUS: I have my good Shepherd,\nAnd I shall not want;\nAnd I feel His warm embrace,\nAnd also His holy love divine.\nI have my good Shepherd,\nHis name I know full well;\nIn Christ my good Shepherd,\nHe leadeth me by His love\nWhich is faithful.\n\nThe ninety and nine He left behind,\nAnd went to seek the wandering sheep;\nIn suffering and grief He sought,\nThat He might find her at last.\nOh, what a loving Shepherd!\nUpon His shoulders He bore her then,\nThat He might grant her life,\nLest she should perish without her Shepherd.\n\nI had no shepherd of my own,\nI was the lost and straying sheep;\nBut now I have a Shepherd,\nAnd I know His voice of life.\nI have promised ever to follow\nWherever His voice shall lead,\nEven the Prince of shepherds,\nWho is my Shepherd;\nI will follow Him."
  },
  "556": {
    "title": "O God, Visit Us, Delay Not",
    "lyrics": "O God, visit us, delay not,\nSend unto us, O Lord, Thy power!\nWe come today unto Thine altars,\nManifest, O Lord, Thy power!\nIt is Thy promise, Savior blest,\nTo grant the Holy Comforter;\nWho will impart a greater zeal.\nYea, show forth, O Lord, Thy power!\n\nGod of Elijah, we implore Thee,\nThat Thou reveal Thy power today;\nThat all the world may know we serve\nThe Living God of grace and power.\nYea, take away all wicked sin,\nImpart to us Thy holiness,\nAnd keep us in Thy liberty;\nYea, show forth, O Lord, Thy power!\n\nRevive us, Lord, and hear our prayer,\nManifest, O Lord, Thy power!\nUplift our heart and faith today,\nPut forth, O Lord, Thy mighty power!\nKindle with fire our every heart,\nBestow on us more sympathy,\nMay we enjoy communion sweet;\nYea, show forth, O Lord, Thy power!"
  },
  "557": {
    "title": "Because Thou Keepest Me",
    "lyrics": "Because Thou keepest the life of my soul,\nTherefore I sing unto Thee, God of love;\nTo Thee, God of heaven, because Thou art good,\nTherefore I bless Thy holy name, Lord,\nThy holy name, Lord.\n\nCHORUS: /:/Thou... who dost care for my life,\nThou... who dost guard all my soul,\nThou... who providest all things,\nI... render thanksgiving to Thee./:/\n\nBecause Thou keepest me under Thy wings,\nI live secure in Thy shadowing shield;\nFor all of Thy blessings I bring songs of praise,\nAnd come here to sing them to Thee, O my Lord;\nTo Thee, O my Lord.\n\nBountiful mercies hast Thou poured abroad,\nAnd day after day I receive from Thy hand;\nMy household and loved ones are kept in this life,\nAnd give all the glory to Thee, Holy God;\nTo Thee, Holy God."
  },
  "558": {
    "title": "A Pilgrim Here Am I",
    "lyrics": "A pilgrim here am I,\nMy home is far away,\nIn the mansion of light,\nEternal peace and love;\nAmbassador am I of the celestial realm,\nOn the business of my King.\n\nCHORUS: Hear this true faithful word,\nWhich a heavenly voice proclaimed:\n\"Be ye now reconciled,\"\nSaith the sovereign Lord and King,\n\"Be reconciled today with your God.\"\n\nThat turned from vile offense, repenting of their sin,\nAll who obedient prove shall reign with Him for aye;\nThis is the faithful word that I must needs proclaim\nOn the business of my King.\n\nFairer my home by far than Sharon's pleasant vale,\nEternal joy and peace reign evermore therein;\nAnd there shall Jesus grant an everlasting home;\n'Tis the message of my King."
  },
  "559": {
    "title": "If the Cruel Foe You Dread",
    "lyrics": "If the cruel enemy thou dost fear to face,\nIf dark doubt oppresses all thine earthly days,\nMay the beauteous light of God within thee shine,\nAnd thou shalt be blessed so.\n\nCHORUS: /:/Let the blessed light shine in,/:/\nMay the beauteous light of God within thee shine,\nAnd thou shalt be blessed so.\n\nIf thy faith in Jesus feeble be and faint,\nIf God doth not answer thy most earnest prayer;\nMay the beauteous light of God within thee shine,\nAnd thou shalt be blessed so.\n\nIf a life of joy thou longest to obtain,\nAnd from evil and the darkness to escape,\nMay the beauteous light of God within thee shine,\nAnd thou shalt be blessed so.\n\nIf we walk within the light, the holy light,\nWe are cleansed and made pure by Jesus' blood,\nRadiant brightness shall possess our inner heart\nIf we live within the light.\n\nIf the Spirit of our God, the Comforter,\nHeavenly light, imparts a splendor from above,\nWhen He finds an entrance into all thy heart,\nHe will be thine endless light."
  },
  "560": {
    "title": "Sinner, Come to Sweet Jesus",
    "lyrics": "Sinner, come unto gentle Jesus,\nAnd forever blest shalt thou be;\nIf in truth thou desirest to have Him,\nThe divine Lord thou surely shalt find.\n\nCHORUS: /:/Come to Him, come to Him,\nFor thy gracious Savior waiteth for thee/:/\n\nIf like a son who hath foolishly sinned,\nThou art seeking compassion at His feet,\nA tender Father in Jesus thou shalt find,\nAnd within His embrace find pardon.\n\nIf thou feelest sick unto death,\nHe will be thy Physician celestial,\nAnd thou shalt find in His blood also\nMedicine that shall heal thine affliction.\n\nLittle sheep that didst flee from the fold,\nBehold thy benevolent Lord!\nAnd borne on His shoulders thou shalt be,\nBy so gentle and loving a Shepherd."
  },
  "561": {
    "title": "Hear, O Sinner, the Voice",
    "lyrics": "Hear, O sinner, the voice of the Savior:\nIf thou art weary, come and find rest;\nGo, tarry not, cast upon me\nAll thy burden, and I will bear it.\n\nCHORUS: Come, come unto me, and thou shalt rest,\nTake today my yoke, I will save thee;\nMeek am I and lowly; thy friend am I,\nCome, confide, I will save thee.\n\nCome unto Him hungry, though poor thou mayst be,\nHeavenly manna is ready for thee,\nGreat is the feast, freely offered to thee,\nChrist doth invite thee.\nCome and thou shalt sup.\n\nThou art straying afar, away from the fold!\nIn the dense mountain shadows, perils untold,\nCease now thy wandering, oh come to the Good Shepherd,\nReturn to the flock, and thou shalt have rest!\n\nPut thy faith in Christ, He will save thee,\nJoy and perfect peace He will grant unto thee.\nNever doth He cast out whoever comes to Him;\nChrist is compassionate, He will receive thee."
  },
  "562": {
    "title": "In Jesus Christ Confide",
    "lyrics": "In Jesus Christ only put thou thy trust,\nCast thy burden on Jesus;\nPeace and relief from Him thou shalt obtain,\nCast thy burden on Jesus.\n\nCHORUS: Cast thy burden on Jesus,\nAnd tell Him of all thy cruel pain;\nIn Christ thy Friend thou shalt find a shelter,\nOh, cast thy burden on Jesus.\n\nRedeeming peace shall thy soul possess,\nCast thy burden on Jesus;\nFrom every distress He will set thee free,\nCast thy burden on Jesus.\n\nFrom conflicts and trials flee never away,\nCast thy burden on Jesus;\nSeek not for peace in the desert waste,\nCast thy burden on Jesus.\n\nEvils assail thee on every hand, sinner,\nCast thy burden on Jesus;\nArt thou now weary of sorrow and grief?\nCast thy burden on Jesus.\n\nChrist is able to banish thy fear,\nCast thy burden on Jesus;\nUnto the faithful He giveth great courage,\nCast thy burden on Jesus."
  },
  "563": {
    "title": "Eternal Life He Promised",
    "lyrics": "Eternal life He hath promised, hath promised,\nTo whosoever, whosoever in Him would believe,\nAnd there with Him he shall dwell,\nFor even such was the word that He gave.\n\nCHORUS: /:/Come to the light that Jesus gives thee/:/\nAnd thou shalt dwell yonder with Him,\nAnd forever thou shalt not die.\n\nHallelujah be unto Him, unto Him!\nFor the great love, for the love that to us He showed,\nBecause He would not suffer to be lost\nWhat the Father hath placed in His hands.\n\nThe time of affliction is coming, is coming,\nWhen there no more, there no more shall be room or place,\nYet even now the Savior\nHath come to deliver and save His own.\n\nTarry thou not, O sinner, O sinner,\nIn coming, in coming unto thy Lord,\nLest on the morrow thou weep and mourn,\nFor the sorrow thy folly hath wrought."
  },
  "564": {
    "title": "If from Sin You Long for Pardon",
    "lyrics": "If from thy sin thou desirest release,\nLook to the Lamb of God!\nHe by His death brought redemption and peace,\nLook to the Lamb of God!\n\nCHORUS: /:/Look to the Lamb of God/:/\nHe only is able to save thee,\nLook to the Lamb of God!\n\nIn trials, temptations, in doubt, and in fear,\nLook to the Lamb of God!\nHe by His strength makes thee conqueror here,\nLook to the Lamb of God!\n\nIf thou art downcast and courage doth fail,\nLook to the Lamb of God!\nThy soul with a song His love shall fill,\nLook to the Lamb of God!\n\nFear not though shadows encompass thy way,\nLook to the Lamb of God!\nIn every trial Christ will shield thee and stay,\nLook to the Lamb of God!"
  },
  "565": {
    "title": "My People, Hearken to My Voice",
    "lyrics": "My people, hearken to my voice,\nOh listen to my call;\nI have redeemed thee, I am thy God,\nI will forgive thee all.\n\nCHORUS: Oh, open Thou my heart!\nOh, open Thou my heart!\nOh, open Thou my heart!\nAnd satisfied I shall be.\n\nOh, if my people faithful were,\nSalvation I would give;\nFrom the oppressor harsh and cruel,\nTheir prison chains I'd cleave.\n\nMy people will not hear my voice,\nNor will they me obey;\nI leave them to their suffering,\nTo perish in the way.\n\nIf yet repentant they return,\nMy mercy they shall see;\nBy my almighty power alone,\nHave health and liberty.\n\nAnd I will grant my richest grace,\nWith honey sweet and bread;\nTheir souls with full contentment filled,\nShall sing with joyful praise."
  },
  "566": {
    "title": "Down at the Cross",
    "lyrics": "Down at the cross where my Savior died,\nDown where for cleansing from sin I cried;\nThere all my sins He hath pardoned free,\nGlory to His name!\n\nCHORUS: /:/Glory to His name/:/\nThere all my sins He hath pardoned free,\nGlory to His name!\n\nDown at the cross where I sought His grace,\nOh, what a wondrous forgiveness given!\nNow with my Jesus I ever dwell,\nGlory to His name!\n\nPrecious fountain of saving grace,\nOh, what great joy in my soul was found,\nWhen in Christ Jesus I pardon found:\nGlory to His name!\n\nSinner, who strayest in guilt and loss,\nCome to this fountain without delay;\nPardon and peace thou shalt surely find:\nGlory to His name!"
  },
  "567": {
    "title": "Have Mercy, O Holy God",
    "lyrics": "Mercy, O holy God, have mercy!\nMercy my pleading heart implores;\nOh, wash me from mine iniquity,\nAnd grant me pardon, joy, and peace.\n\nMy transgressions are grievous sore:\nThey are against Thee, Thee alone;\nYet, Lord, create a clean heart in me,\nAnd a right spirit within renew.\n\nNo sacrifice dost Thou desire,\nSave a contrite and humble heart;\nMy offering Thou wilt not despise,\nSince full of all compassion Thou art.\n\nSave me, O God, by Thine own power,\nFor all my hope is stayed in Thee;\nTrembling, I wait upon Thy will:\nBe Thou compassionate unto me."
  },
  "568": {
    "title": "When I Returned Home",
    "lyrics": "When I returned to my Father's home,\nChrist did not cast me away from Him:\n/:/All of my vices and all my transgressions,\nChrist hath now taken away from me/:/\n\nCHORUS: /:/Wonderful is He,\nOh, yes, how beautiful!\nChrist hath saved even me/:/\n\nNever could I have dreamed that He would save my soul,\n/:/Out of my sin He hath washed me clean,\nWholeness and life He doth give/:/\n\nWondrous I saw Him to be, who so hath loved me,\n/:/All of my failings He hath erased,\nSanctifying my soul/:/\n\nHe doth prepare the way, heals me and keeps each day,\n/:/Life everlasting is now my lot,\nGlory, hallelujah to Him/:/"
  },
  "569": {
    "title": "Would You Be Saved?",
    "lyrics": "Wouldst thou be saved from iniquity's pow'r?\nThere is power alone in my Jesus;\nWouldst thou in holiness live and rejoice?\nThere is power alone in Jesus.\n\nCHORUS: There is pow'r, pow'r, wonder-working pow'r\nIn Jesus, who died;\nThere is pow'r, pow'r, wonder-working pow'r\nIn the blood that He hath shed.\n\nWouldst thou be free from all passion and pride?\nThere is power alone in my Jesus;\nWouldst thou o'ercome every cruel temptation?\nThere is power alone in Jesus.\n\nWouldst thou do service for Jesus thy King?\nThere is power alone in my Jesus;\nCome, and salvation He freely will bring,\nThere is power alone in Jesus."
  },
  "570": {
    "title": "Long I Wandered in the Dark",
    "lyrics": "Long I wandered in paths of dark deceit,\nBurdened down beneath my sin and guilty fear,\nTill I looked upon the Savior,\nAnd I heard His tender voice:\nJesus set me free forever by His love.\n\nCHORUS: I am free, I am free,\nBy the grace of Christ my Lord I am free;\nI am free unto this day,\nHallelujah, through my faith, I am free!\n\nLong I wandered in paths of dark deceit,\nNever thinking of the Savior's dying love;\nWandering farther, farther still,\nFar away from my Redeemer,\nYet today through His own death I am set free!\n\nLong I wandered in paths of dark deceit,\nNow I only walk with Jesus Christ my Lord;\nI would hear His tender voice,\nFollowing where He leads the way:\nGlory, glory to our faithful Shepherd be!"
  },
  "571": {
    "title": "Would You Overcome the World?",
    "lyrics": "Wouldst thou overcome the world and all its power?\nWouldst thou sing for joy in sorrow's darkest hour?\nWouldst thou valiant be and joyful as a soldier true?\nKeep in living touch with Christ the Savior.\n\nCHORUS: Keep in living touch with Christ the Savior,\nThen the darkness shall not overwhelm thy soul;\nOn the path of joyful light thou shalt journey on,\nEver keeping touch with Christ the Savior.\n\nIn the world are many mourning in their sin,\nWeeping sore within the bitterness of soul;\nBear the blessed word to them, do not silent stay:\nKeep in living touch with God forever.\n\nWouldst thou have communion with thy God above,\nAnd His glory ever in thy life abide?\nLet the world behold the beauty of the Lord in thee:\nKeep in living touch with God the highest.\n\nLet the Holy Spirit plant within thy heart\nJesus' meekness and His holy boundless love;\nWatch and pray unceasingly, for the Lord will come:\nKeep in living touch with Christ the Savior."
  },
  "572": {
    "title": "There Is a Precious Fountain",
    "lyrics": "There is a precious fountain drawn,\n/:/Fountain drawn/:/\nThere is a precious fountain drawn\nFrom blood of Immanuel,\nThat purifieth everyone,\n/:/Everyone/:/\nThat purifieth everyone\nWho plunges into it.\n\nCHORUS: O heavenly fountain, stream of crimson dye!\nI remember the day when washed from sin was I.\n\nThe dying thief was turned to faith,\n/:/Turned to faith/:/\nHanging upon a cross;\nHe saw that fountain and was washed,\n/:/He was washed/:/\nHe saw that fountain and was washed,\nBelieving in Jesus.\n\nAnd there have I, my humble soul,\n/:/My humble soul/:/\nAnd there have I, my humble soul, washed clean from every stain;\nThe glory of His wondrous pow'r,\n/:/Wondrous pow'r/:/\nThe glory of His wondrous pow'r\nI joyfully extol.\n\nEternal stream of crimson hue!\n/:/Crimson hue/:/\nEternal stream of crimson hue,\nThou flood of purest love!\nShall wash /:/Forevermore in Thee/:/\nShall wash forevermore in Thee,\nThe people of the Lord."
  },
  "573": {
    "title": "Have You Found in Christ?",
    "lyrics": "Hast thou found in Jesus full salvation free,\nThrough the blood that Christ shed on the tree?\nDoth it cleanse thy heart from every stain of sin?\nArt thou washed in the soul-cleansing blood?\n\nCHORUS: Art thou washed in the blood,\nIn the blood of Christ Jesus the Lord?\nIs thy heart made whiter than the driven snow?\nArt thou washed in the soul-cleansing blood?\n\nDost thou walk each day beside the Savior dear,\nThrough the blood that for sinners He shed?\nArt thou over sin a conqueror through faith?\nArt thou washed in the soul-cleansing blood?\n\nWilt thou have white robes when Jesus comes again?\nArt thou clean in the fountain of love?\nArt thou ready for the mansions of the blest?\nArt thou washed in the soul-cleansing blood?\n\nChrist offers today both purity and pow'r,\nOh, make haste unto Jesus the Lord!\nHe the fountain is to cleanse thy soul within:\nOh, wash in His soul-cleansing blood!"
  },
  "574": {
    "title": "I Surrender All",
    "lyrics": "All to Jesus I surrender,\nFaithful unto Him to be;\nEvermore I want to love Him,\nPleasing Him and Him alone.\n\nCHORUS: I surrender all,\nI surrender all,\nAll to Christ I now surrender,\nFaithful I would be.\n\nAll to Jesus I surrender,\nHumbly at His feet I bow;\nWorldly pleasures I have left behind,\nAnd I follow Him from now.\n\nAll to Jesus I surrender,\nYea, with all my heart and mind;\nBody, soul to Him I yield now,\nSeeking His anointing grace.\n\nAll to Jesus I surrender,\nNow I feel the sacred flame;\nOh, what joy is in my spirit,\nGlory, glory to my Lord!"
  },
  "575": {
    "title": "Take My Life, and Let It Be",
    "lyrics": "Take my life, and let it be\nConsecrated, Lord, to Thee;\nTake my hands, and let them move\nAt the impulse of Thy love.\n\nCHORUS: Wash me in Thy precious blood, O Lord,\nCleanse me from my guilt and iniquity;\nHere I bring my life to Thee,\nEvermore, O Lord, to be\nThine for all eternity!\n\nTake my feet, and let them be\nSwift on holy paths for Thee;\nAnd to Thee, Lord, may my voice\nEver in Thy praise rejoice.\n\nTake my moments and my days,\nConsecrated to Thy praise;\nLet my lips forever speak\nOnly of Thy boundless love.\n\nTake my will, O God, and make\nThine alone for Jesus' sake;\nTake my heart, it is Thine own,\nIt shall be Thy royal throne.\n\nTake my love, which here today\nAt Thy feet I humbly lay;\nTake myself, and I will be\nEver, only, all for Thee."
  },
  "576": {
    "title": "Would You Live for Jesus?",
    "lyrics": "Wilt thou live for Jesus,\nFaithful to the end abide?\nIn the path of peace,\nWalking ever at His side?\nAt the cross's foot\nWilt thou cast thy cares away?\nLet Him have His way with thee.\n\nCHORUS: His mighty pow'r His blessings will bestow,\nAnd peace and joy within thy soul shall flow;\nFrom every stain thy heart He will make free:\nLet Him have His holy way with thee.\n\nWouldst thou follow after Jesus,\nBearing up the cross?\nWouldst thou know the peace of Christ in gain or loss?\nWouldst thou have Him lead thee in His holy light?\nLet Him have His way with thee.\n\nWouldst thou meet thy loved ones in the realms of light?\nThou must make thy heart prepared without delay;\nWilt thou consecrate thy life to Him alone this hour?\nLet Him have His way with thee."
  },
  "577": {
    "title": "I Am Thine, O Lord",
    "lyrics": "I am Thine, O Lord, I have heard Thy voice,\nAnd it told Thy love unto me;\nYet I long to rise on the wings of faith,\nAnd be closer drawn to Thee.\n\nCHORUS: Draw me nearer, nearer to Thy voice,\nWash me, O my Savior blest!\nDraw me nearer, nearer, nearer to Thy cross,\nLead me, Shepherd, to Thy breast!\n\nConsecrate me now to Thy service, Lord,\nBy the constraint of Thy love;\nBody, soul, and spirit I yield to Thee,\nServing Thee, my Lord above.\n\nOh, the pure delight of a single hour\nIn communion at Thy feet,\nWhen I talk with Thee, and Thy gentle voice\nHear in meditation sweet!\n\nThere are depths of love that I cannot know\nTill I cross the narrow sea;\nThere are heights of joy that I may not reach\nTill in glory, Lord, with Thee."
  },
  "578": {
    "title": "I Can Hear Thy Voice",
    "lyrics": "I can hear Thy sweet voice calling,\nIn its tender, loving accents;\nI can hear Thy gracious bidding:\n\"Take thy cross and follow after Me.\"\n\nCHORUS: Where Thou leadest I will follow,\nIf Thy gentle hand will guide me;\nSavior, I would follow after,\nEverywhere I'll follow, follow Thee.\n\nI will follow through the garden,\nThrough the dark and sorrowing pathway;\nFollowing Thee with joy unceasing,\nI will suffer with Thee, Jesus mine.\n\nI will suffer for Thee, Master,\nIf Thy grace divine uphold me;\nAnd if Thou wilt go beside me,\nI will die with Thee, my Savior blest.\n\nThou wilt give me grace and glory,\nAnd sustain my soul forever;\nEvery hour I need Thee, Savior,\nAnd forever Thou wilt lead my way."
  },
  "579": {
    "title": "More Like Jesus",
    "lyrics": "More like the Master\nI would ever be,\nMore of His meekness,\nMore humility;\nZeal in His service,\nFaithfulness to show,\nMore consecrated\nTo His work below.\n\nCHORUS: Take Thou my life,\nFor Thine alone it is;\nTake Thou my life,\nI give it, Lord, to Thee.\nCleanse Thou my heart,\nI earnestly implore;\nKeep me, I'm Thine\nHenceforth forevermore.\n\nMore like my Savior, this is all my prayer:\nMore strength to bear, more patient resignation;\nMore earnest ever, more devout and true,\nTo bring the lost unto the sacred altar.\n\nMore like my Savior,\nDeeper faith to know,\nMore of His kindness,\nTender love below;\nLike Him the patient,\nHumble, pure, and true:\n'Tis my desire\nTo walk like Christ below."
  },
  "580": {
    "title": "No Longer Is My Life as Once It Was",
    "lyrics": "No longer is my life as once it was,\nBlotted out is my every sin;\nToday I gladly sing, \"Hallelujah!\"\nAnd joyful journey toward sweet home.\n\nCHORUS: The pathway is very narrow,\nYet /:/I follow it/:/\nThe pathway is very narrow,\nYet I follow it;\nI follow it in the footsteps of Jesus.\n\nMy life was cruel disillusion,\nA constant Friend have I found;\nMore light and sweet consolation\nI found in my good Savior.\n\nNo more of mourning nor cruel grief,\nLike clouds they have fled away;\nTo heaven I look with rejoicing,\nWhere is glory, glory, and glory without end."
  },
  "581": {
    "title": "I Would Follow in the Steps",
    "lyrics": "I would follow the steps of the Master,\nI would go after my King and Lord;\nAnd fashioning by Him my spirit,\nI sing with joy to my Redeemer.\n\nCHORUS: How beautiful to follow,\nThe footsteps of the Master!\nAlways in the light,\nClose to Jesus;\nHow beautiful to follow the footsteps\nOf the Master!\nIn His holy light.\n\nI walk closer to Him who doth guide me,\nWhen the evil one seeketh to tempt;\nEver trusting in Christ, my strong fortress,\nWith joy I must praise His holy name.\n\nI follow His steps of tender mercy,\nLovingkindness, favor, and truth;\nLooking toward Him,\nBy the gift of His grace,\nI go to my rest,\nThat glorious city.\n\nI would follow the steps of the Master;\nEver upward with Him would I walk,\nBeholding my King in glorious beauty,\nWith Him in glory I shall rest."
  },
  "582": {
    "title": "Christ Hath Promised",
    "lyrics": "Christ promiseth that one day\nJoyful He will bring me to rejoice,\nUnto a place so very precious,\nWhere weeping shall be no more.\n\nCHORUS: There is a place so very precious,\nThere is a place of greater love,\nWhere ransomed souls are singing\nGlory to the good Savior.\n\nWhen I wandered about in the world,\nWithout comfort in all my grief,\nNow I journey full of gladness,\nHaving His promise of love.\n\nI know that Christ doth prepare\nA heavenly mansion on high,\nThat souls may ever be singing\nPraises to the good Savior."
  },
  "583": {
    "title": "O Christ of Mine!",
    "lyrics": "¡Oh Cristo mío!\nThou art my faithful Friend;\nSure shelter only in Thee shall I have.\nIn my afflictions,\nGood Jesus, I will come to Thee,\nAnd comfort and gladness\nThou wilt give me, O yes!\n\nCHORUS: Christ, come Thou closer;\nPerfect peace within my soul bestow,\nNear, yea, nearer to my heart.\n\nWhen in the night a thousand stars I see,\nThy wondrous voice may my soul ever hear;\nCause me to ponder Thy tender, sweet love,\nAnd may I praise Thee with fervent devotion.\n\nWhen from this mortal life I must depart,\nChorus: A beauteous crown Thou wilt gird upon me,\nAnd with sweet song Thy goodness I will praise,\nAnd in glory's mansion evermore abide."
  },
  "584": {
    "title": "If Any Man Be in Christ",
    "lyrics": "If any man be in Christ,\nA new creature is he,\nHaving buried the old nature of his soul,\nWalking in newness of life,\nServing with his very best,\nKnowing that his labor\nIs not in vain in the Lord.\n\nCHORUS: Let us all follow the Lord Jesus,\nYielding obedience only to Him;\nMay He direct us by His path and light,\nAnd grant us to be His faithful Church.\n\nToday He calleth the weary,\nJesus the Savior,\nLifting from them the burden the tempter laid;\nAnd forth they go in freedom, walking far and wide,\nThe holy name of Christ\nMaking known to all.\n\nThe Bible is our sure refuge,\nIt brought us holy instruction;\nIt serveth as a beacon\nThat enlighteneth the heart.\nAnd then the promise that Christ to us hath sent\nBestoweth upon us strength,\nPeace, joy, and holy love.\n\nLet us lift up our songs\nTo God in gratitude,\nFor He hath made us holy\nThrough Christ in His virtue;\nLet us fix our eyes\nOn Christ our Captain,\nThen by His mighty strength\nWe shall conquer Satan."
  },
  "585": {
    "title": "Holy Spirit, Guide My Steps",
    "lyrics": "Holy Spirit, guide my steps unto the Lord,\nAnd grant that humbly I may ever keep\nThe commandments of Thy love.\n\nCHORUS: Tell me, tell me how to consecrate\nAll to the Father of grace,\nTell me, tell me how to do His will.\n\nTell me how to be submissive\nAnd yield up my whole being,\nVain pleasures and fleeting treasures\nEver truly to despise.\n\nTell me how, when sorely tried,\nI must ever trust in Him;\nAnd though suffering in anguish,\nNever of His grace despair.\n\nTell me how to obey Him,\nThough at times my feeble mind\nMay not grasp Thy holy counsel\nNor an easy answer find.\n\nTell me how I ought to follow Him,\nNever trusting in my wisdom,\nYielding all unto His service\nAnd relying on His power."
  },
  "586": {
    "title": "Have Thine Own Way, Lord",
    "lyrics": "Have Thine own way with me, Lord,\nThou art the Potter, I am the clay;\nPliant and humble I long to be,\nThy will be done in me evermore.\n\nHave Thine own way with me, Lord,\nLook on me, search Thou and prove my heart;\nWash me and cleanse me from every sin,\nThat I may ever abide with Thee.\n\nHave Thine own way with me, Lord,\nHeal Thou my wounds and my sorrow deep;\nAll power, O Christ, is Thine alone,\nStretch forth Thy hand and I shall be whole.\n\nHave Thine own way with me, Lord,\nAbsolute Master of me be Thou;\nGrant me the unction of the Holy Ghost,\nThat all the world may see Christ in me."
  },
  "587": {
    "title": "Oh, How Sweet to Trust in Jesus!",
    "lyrics": "Oh, how sweet to trust in Jesus,\nAnd to yield my all to Him,\nTo rely upon His promise,\nAnd along His paths be true!\n\nCHORUS: Jesus Christ, O Jesus Christ,\nThou hast proved Thy love to me;\nJesus Christ, O Jesus Christ,\nEver I would trust in Thee.\n\n'Tis so sweet to trust in Jesus,\nAnd fulfill His holy will,\nDoubting not His sacred word,\nWhich is light and truth divine.\n\nEver sweet to trust in Jesus,\nWhen the longing heart doth seek\nTreasures of celestial glory,\nFull of pardon and of peace.\n\nEver in Thee I'd confide,\nO my precious Savior blest;\nBoth in life and through death's valley\nMay Thy love my refuge be."
  },
  "588": {
    "title": "Hast Thou Tried to Bear Thy Burden?",
    "lyrics": "Hast thou tried to bear thy burden\nAll alone, all alone,\nKnowing not that help awaits thee\nIf thou wouldst come to the Lord Jesus?\n\nCHORUS: If I have burdens\nWhich I alone must bear,\nPatient I lift them and come to my Lord;\nIf I have crosses that none else can bear,\nHis help my blessed Lord\nDoth grant me in His love.\n\nNe'er forget that unto Calvary\nJesus went, all alone,\nTo bestow on thee salvation,\nWhen He died upon the cross.\n\nOnly in Christ protection and aid\nShalt thou find, shalt thou find;\nBring unto Him thy every burden,\nFor He ne'er turned one away."
  },
  "589": {
    "title": "On the Vast and Surging Billows",
    "lyrics": "On the billows immense\nOf the tempest-tossed sea, that assaileth my soul,\nThe frail, trembling bark,\nOn my knees unto Christ\nI cried out, and the storm\nWas destroyed in an instant\nAt the voice of my God.\n\nCHORUS: Christ is the Rock,\nThe anchor of my faith;\nAll evils, laments,\nAnd cries of dread fear\nAre ended forever\nWith my Sovereign King;\nYea, Jesus Christ is my refuge.\n\nHe keepeth me from perils,\nFrom trials, and from pain;\nHe commandeth the fierce winds\nTo stir up no storm;\nThe raging seas are quieted,\nThe billow sank to rest,\nAnd in Christ I fix my anchor,\nTrusting Him more and more.\n\nMy sweet Savior,\nYea, my wondrous Friend and God,\nWho delivereth from sorrows\nAnd casteth out bitter gall:\nBy faith I'll go to heaven,\nHome of the God of love,\nThe unceasing fountain\nOf goodness and joy."
  },
  "590": {
    "title": "When I Need Thee",
    "lyrics": "When I need Thee, Thou art near me,\nMy good Jesus will not leave me;\nEver loving Thou'lt uphold me,\nWhen I need Thee most.\n\nCHORUS: /:/When I need Thee most/:/\nThou art near, my blessed Savior,\nWhen I need Thee most.\n\nWhen I need Thee, ready Thou art,\nAnd forsake me Thou wilt never;\nPeace for sadness Thou dost give me,\nWhen I need Thee most.\n\nWhen I need Thee, Thou wilt fail not,\nHour by hour Thou wilt guide me;\nTender mercies Thou wilt show me,\nWhen I need Thee most.\n\nWhen I need Thee, Thou dost come, Lord,\nAnd Thy presence is so sweet;\nStreams of full salvation flow,\nWhen I need Thee most."
  },
  "591": {
    "title": "Why Should I Be Discouraged?",
    "lyrics": "Why Should I Be Discouraged?\nWhy walk in shadows dim?\nWhy feel so lonely, and in sorrow live,\nWhen Christ is all my comfort,\nMy Friend forever true,\n/:/When e'en the birds find refuge safe in Him/:/\n\nCHORUS: Happy and glad in singing,\nI dwell in peace below:\nIf He doth watch the sparrows,\nHe'll surely watch o'er me!\n\n\"Never be thou discouraged,\"\nI hear the Savior say,\nAnd on His promise resting,\nI chase all grief away.\nClose in the steps of Jesus\nI follow without cease,\n/:/And all His lovingkindness\nHe gives me without bound/:/\n\nWhenever I am tempted,\nOr in the shadow go,\nStill closer walk I with Him,\nSafe shielded from the foe.\nIf faith within me falter,\nAnd I sink in distress,\n/:/He alone lifts me upward,\nAnd giveth peace and rest/:/"
  },
  "592": {
    "title": "I Have No Anxious Cares",
    "lyrics": "I have no anxious cares, nor have I fear\nOf what awaiteth me here;\nI trust alone in my good Savior,\nWho ever careth for me.\n\nCHORUS: I live by faith in my Savior,\nI will not fear, He is true;\nIn every strife He will never leave me,\nI live by faith, He will keep my soul.\n\nFierce tempests may arise,\nFull well I know;\nThe shining sun may lose its light;\nEarthly friends may also\nForsake my side,\nYet Jesus will ever sustain me.\n\nThe God who clotheth the lilies here\nSustaineth the sparrow too;\nHe never, no never can forsake me,\nHis child am I by His grace.\n\nOne day the Lord will come again,\nTo heaven He'll bear us home;\nThere care and fear shall cease forever,\nAnd God shall reign over all."
  },
  "593": {
    "title": "Master, the Tempest Is Raging",
    "lyrics": "Master, the tempest is raging,\nAnd wildly the billows roar!\nThe vast expanses of heaven\nAre shadowed with dark despair;\nCarest Thou not that we perish?\nHow canst Thou slumber so,\nWhen the tossed sea openeth wide\nA deep grave for us below?\n\nCHORUS: The winds, the waves shall hear Thy voice:\nPeace, be still! Peace, be still!\nThou calmest the wrath of the darksome sea,\nThe strifes of the soul Thou dost cause to cease;\nAnd thus the small bark where the Lord doth ride\nCan never go down in the treacherous sea.\nEverywhere is Thy will fulfilled:\nPeace, be still!\nThy voice resounds through the boundless deep:\nPeace, be still!\n\nMaster, with anguish of spirit\nI seek Thee in grief and woe;\nDeep in the caves of my troubled soul\nFierce storms of affliction blow;\nSin like a torrent doth sweep along\nOver my fragile frame;\nAnd I perish, I perish, O Master,\nOh, hasten to rescue me!\n\nMaster, the tempest is over,\nThe winds roar in wrath no more,\nAnd over the crystal waters\nThe sunlight doth brightly shine.\nMaster, prolong this holy calm,\nForsake me, O Lord, no more;\nThrough the deep gulfs I'll journey with Thee,\nRejoicing in blessed peace!"
  },
  "594": {
    "title": "My Father Is the King",
    "lyrics": "My Father is King,\nRich beyond compare,\nHe holdeth great treasures\nAfar and near;\nHis gold and His diamonds\nI cannot count,\nRich stores that no earthly\nCoffer can hold.\n\nCHORUS: /:/ I'm a child of the King,\nA child of the King;\nWith Jesus my Savior,\nI'm a child of the King. /:/\n\nThe Son of our God,\nMy Savior so good,\nCame down to this world,\nIn poverty dwelt;\nToday He doth reign\nIn glory and praise,\nAnd home in high heaven\nHe offered to me.\n\nA wanderer once,\nWithout home or land,\nA stranger and vile,\nWithout God and faith;\nYet Jesus the blest\nHath made me His own,\nA crown and a mansion\nIn heaven I'll have.\n\nWhat matter if here\nNo dwelling I own!\nI have a bright mansion\nBeyond the sun;\nAnd until I reach it,\nFull gladly I sing:\nI'm a child of the King,\nHallelujah to God!"
  },
  "595": {
    "title": "Happy Moment",
    "lyrics": "Happy moment when I chose\nTo serve Thee, my Lord and God!\n'Tis sweet that my joy in Thee\nBe shown both in deed and voice.\n\nCHORUS: I am glad! I am glad!\nAnd in Thy rich grace I will rejoice;\nIn freedom and light I walked,\nWhen faith within me did prevail,\nAnd that same crimson stream\nHealed all the sickness of my soul.\n\n'Tis done! My great vow is fulfilled;\nI am Christ's, and He is mine;\nHe drew me, and gladly I went,\nHis voice each believer knows.\n\nNow rest, O my feeble heart,\nPut all thy contentions to end;\nI've found a far nobler estate,\nAnd share in a banquet divine.\n\nA solemn vow once I made\nWhen baptism I received;\nHe pardoned my every grief,\nAnd washed me in His own blood."
  },
  "596": {
    "title": "Unto My Soul a Song Doth Come",
    "lyrics": "Unto my soul a song doth come,\nA chorus of joy and peace;\nI sing it with grateful love,\nSweet peace, the gift of my God.\n\nCHORUS: Peace, peace, sweet peace,\nPrecious gift of our God.\nO peace, marvelous peace!\nThe gift of love from my God.\n\nThrough Christ on the cross came peace,\nMy debt was by Him erased;\nNo other foundation stands,\nFor peace, the gift of my God.\n\nWhen I was redeemed by Him,\nMy soul was with peace adorned;\nIn Him my rich treasure I found,\nSweet peace, the gift of my God.\n\nAbiding in peace in the Lord,\nAnd while I may walk with Him,\nThere's naught but sweet peace for me,\nFair peace, the gift of my God."
  },
  "597": {
    "title": "In Darkness Without Jesus",
    "lyrics": "In darkness without my Jesus I walked,\nWith manifold grief and pain;\nYet Jesus called gently: \"Come, come unto Me,\nThy Savior I fain would be.\"\n\nCHORUS: In my soul there is sweetest peace,\nSince I unto Jesus came;\nThere never shall be any night,\nNaught else but glad joy and peace,\nSince I in His light abide.\n\nBy the surging great waves of wickedness\nFar carried was I more and more,\nWithout any pilot to guide through the storm,\nTill Jesus the Savior I saw.\n\nIn the fierce, bitter strife thou art sorely beset,\nWithout any friend or relief!\nOh, weep thou no longer, but look on the face\nOf Jesus, thy heavenly Friend!"
  },
  "598": {
    "title": "If Thy Cup Runneth Over",
    "lyrics": "If thy cup runneth over, all doubts flee away,\nFor the Lord watcheth over thy soul;\nGod ordereth thy pathway, and angels shall come\nTo guard all thy goings below.\n\nCHORUS: /:/ If thy cup runneth over with love /:/\nFull gladly then shalt thou sing,\nAnd more and more shalt thou pray,\nIf thy cup runneth over with love.\n\nIf thy cup runneth over, no fear can remain\nTo burden thy sorrowful heart;\nAbundant and rich is His marvelous grace,\nSublime is His infinite love.\n\nIf thy cup runneth over, thou wilt not withhold\nA blessing to others in need;\nNew wine shall be given that never shall fail,\nAccept now the call of His grace."
  },
  "599": {
    "title": "Great Joy Is in My Soul Today",
    "lyrics": "Great joy is in my soul today,\nFor Jesus hath saved me by faith;\nThe chains He hath broken in twain,\nAnd my soul He hath saved.\n\nCHORUS: Glory, glory to Jesus the Lord,\nIn truth He is all unto me;\nOf His joy He bestowed upon me\nOn the cross, where for me He died.\n\nDeep gratitude fills my soul today,\nAnd with joy I will gladly sing\nThanksgivings to Jesus my Savior;\nAll glory to Him will I give.\n\nHe keepeth me safe from the tempter,\nHe helpeth me all things to conquer;\nHe granteth His holy protection,\nBy His great and almighty power.\n\nOf His wondrous love I would herald\nTo those who in darkness yet roam;\nI would cause them to know and to see\nThat He longeth to save them today.\n\nCome to Christ now today, O thou sinner,\nAnd accept His salvation so free;\nThe Savior will never reject thee,\nAnd today He will ransom thy soul.\n\nWhen at last I shall enter that glory,\nWhere the love of our God ever reigns,\nA crown from His hand He will give me,\nO what gladness and heavenly bliss!"
  },
  "600": {
    "title": "Land of Palestine",
    "lyrics": "O land of Palestine,\nSo beauteous and divine,\nWhere Jesus Christ was born...\nThou art the crown of nations,\nBathed in the radiant glow,\nThat shed abroad its light.\n\nCHORUS: Thou art the unforgettable story,\nFor on thy soil was poured\nThe blood, the precious blood\nOf the only begotten Son of God\n\nHistory telleth of a past,\nThat on thy sacred ground\nWas born the Savior Lord;\nAnd in the fair olive groves\nHe preached unto the thousands\nThe holy word of God.\n\nIn thee abide silent witnesses,\nWhich are the ancient walls\nOf old Jerusalem...\nOld broken walls, in ruins laid,\nThat had they life within,\nWould speak to us as well."
  },
  "601": {
    "title": "Rejoicing on My Way",
    "lyrics": "Rejoicing I go on unto that blest home,\nWalking, walking,\nI would not here forever abide,\nWalking unto that home.\n\nChorus: /:/Walking/:/\nUnto that home, where my Jesus is.\n/:/Walking/:/\nBy the hand of the Lord Jesus.\n\nLeaving this world behind with joy I go,\n/:/Walking/:/\nJesus hath promised: “I am with thee,”\nWalking unto that home.\n\nI would that sinners also should arrive,\nWalking, walking,\nFor Christ desireth all men here to save,\nWalking unto that home.\n\nThen shall I with joy behold my Christ,\nIn glory, in glory,\nForever with the saints I shall praise Him,\nIn that fair and beauteous home."
  },
  "602": {
    "title": "To Be in the Presence of Christ",
    "lyrics": "In the presence of Christ to be,\nTo behold His face, what will it be!\nWhen at last in fullest joy\nMy soul shall gaze upon Him.\n\nChorus: Face to face I hope to see Him,\nFar beyond the azure sky;\nFace to face in all His glory,\nI shall see my Jesus there!\n\nOnly through a veil dimly,\nCan I look upon Him here:\nYet full soon the day is coming\nThat His glory shall display.\n\nWhat great joy with Christ our Savior,\nWhen no sorrow shall remain,\nWhen all perils shall have ceased,\nAnd we rest within His love.\n\nFace to face, oh, how glorious!\nShall it be to live thus blest;\nTo behold the face of Him\nWho our souls willed to redeem."
  },
  "603": {
    "title": "I Am a Pilgrim",
    "lyrics": "I am a pilgrim on the earth,\nFar I wander from my home;\nMy soul with longing waiteth\nFor the coming of the Lord;\nHere is no abiding city,\nHere no end to conflict known,\nYet the presence of my Jesus\nGlory unto me shall be.\n\nChorus: Peace, sweet home I long to enjoy,\nWith my Jesus I shall dwell.\n\nWhile I dwell within this world,\nI will live and walk by faith;\nFor His promise doth assure me\nThat one day I shall Him see;\nEver abideth with me\nThe true, faithful Comforter,\nGuiding me continually\nTo the springs of heavenly love.\n\nIf so happy is the soul\nThat doth follow after Christ,\nWhat will it be when in His glory\nComes the Son of the Great God!\nThen shall we indeed behold Him,\nSeated high in majesty;\nBliss unspeakable we'll have\nIn the heavenly City fair."
  },
  "604": {
    "title": "There Shall Be No Sorrow",
    "lyrics": "There shall be no sorrow in heaven,\nNor weeping, nor bitter pain;\nThere is no heart that is anguished\nWhere the God of love doth reign.\nThe clouds of our earthly horizon\nShall never appear over there;\nThe Sun in His radiant glory\nDoth shed His celestial light.\n\nChorus: I go to the Home of the soul,\nWhere Christ doth prepare me a place,\nWhere all of the sanctified people\nForever to dwell shall go home.\nThe day of rejoicing draweth near\nWhen the sun for me shall set;\nOh, what joy it will be\nWhen I gaze on the Lord in\nThat beautiful City above!\n\nThere is no affliction in heaven,\nNor trials exist over there;\nThe soul that in Christ doth repose\nSecure in His bosom shall be.\nThere is no temptation in heaven,\nNor shadows of terrible death;\nThe tree of life bloometh in beauty,\nWhere floweth the river of God.\n\nHow sweet it will be in the heavens,\nWhen past are the sorrows down here,\nTo see ourselves gathered together\nWith all our beloved ones there!\nThrough all of the ages eternal,\nWhat bliss unexpressed it shall be,\nTo be in the presence of Christ,\nDelighting in pleasures for aye."
  },
  "605": {
    "title": "Thy Holy Word",
    "lyrics": "Thy holy Word gently calleth\nUnto every sinful man,\nTo bestow on him sweet comfort\nAnd to fill him with Thy love;\nIf he receive it in spirit,\nHis heart shall truly perceive\nThat in truth and deed Thou lov’st him,\nO Thou Savior all-divine.\n\nChorus: Heaven, stars, and sea, and earth,\nAll things, all shall pass away;\nOnly Thine eternal Word\nUnto ages shall endure.\n\nThy Word of salvation given\nIs the truth, the life, the light,\nShining forth through every hour\nLeading where Thou art enthroned;\nGrant to me the sacred honor\nEvermore Thy cross to bear,\nAnd to reach that realm of glory\nWhere Thou dwellest, Jesus mine.\n\nThy Word is the Bread of heaven,\nSpiritual sustenance;\nWhen it reacheth wounded spirits,\nSolace, peace it doth impart;\nWhosoever doth receive it\nNever, nevermore shall die,\nFor Thou wouldest have him living\nUnto all eternity."
  },
  "606": {
    "title": "There Is None Like Jesus",
    "lyrics": "There is none like Jesus,\nAnother faithful friend,\n/:/There is none/:/\nNone other who can save our souls,\n/:/There is none/:/\n\nChorus: He knoweth all our struggles,\nAnd He alone will us sustain;\nThere is none like Jesus, another faithful friend,\n/:/There is none/:/\n\nThere is no other friend so holy and worthy,\n/:/There is none/:/\nYet at the same time\nHe is meek and gentle,\nNone other is there like Jesus.\n\nThere is not a moment that He forgets us,\n/:/There is none/:/\nNor darkest night that He doth not keep us,\n/:/There is none/:/\n\nWhen is the Shepherd Divine unfaithful?\n/:/Not once/:/\nWhen doth He turn away the sinner?\n/:/Not once/:/\n\nIs there another gift like Christ?\n/:/There is none/:/\nHe hath promised to abide with me\n/:/Unto the end./:/"
  },
  "607": {
    "title": "Some Day I Shall No Longer Be",
    "lyrics": "Some day I shall no longer be\nIn my own place among this flock,\nYet oh, how gladly shall I wake\nWithin the palace of my King!\n\nChorus: I shall behold Him, and in sweet love\nI'll go to dwell with Him on high,\nAnd say to Him: “My blessed Lord,\nBy grace alone was I redeemed.”\n\nSome day grim death will surely come,\nIt will come, yet when I cannot know;\nYet this I know: with my good God\nA happy place I then shall have.\n\nSome day, even as the setting sun,\nMy sunset and my end shall come;\nYet will my blessed Lord then say:\n“My faithful servant, come with Me.”\n\nThat blessed day for which I wait,\nWith my lamp burning bright and clear,\nThe Lord shall open wide the gates,\nAnd my soul to Him with joy shall go."
  },
  "608": {
    "title": "Signs of the Coming of Christ",
    "lyrics": "When thou hearest the rumors of war,\nWhen thou hearest the crying and pain,\nWhen thou hearest all these sore distresses,\nIt is only beginning of sorrows,\n\n1st Chorus: This will be the sign, that Christ\nCometh in His glory,\nAll the nations shall see, and with\nFear they shall stand,\nThey will see the King of kings there upon\nHis throne of glory,\nJudging all of the earth, and great\nLamentation there shall be.\n\nWhen thou hearest that someone doth tell thee:\n“Behold, here is Christ!” “Oh, behold Him there!”\nGive no heed unto these false sayings,\nFor our redemption then draweth nigh.\n\nWhen Christ shall descend in His glory,\nMighty wonders and signs He shall show,\nAll the nations shall then be assembled,\nHis victory there consummated shall be.\n\n2nd Chorus:\nThis will be the sign, that Christ\nCometh in His glory,\nTo His mansion He'll take all those\nWhom He hath purchased,\nHis face they shall see, and rejoice\nThere in His glory,\nWith Jesus Christ the King... (pause)\nForevermore\nJoy there shall be."
  },
  "609": {
    "title": "Stand Firm for Christ",
    "lyrics": "Stand firm for Christ our Savior!\nYe soldiers of the cross,\nLift high today the banner in Jesus' holy Name;\nThe victory is before us,\nWith Him our Captain true,\nThrough Him shall be defeated\nThe hosts of Satan's realm!\n\nChorus: Stand firm today,\nYe soldiers of Jesus,\nLift high today the banner,\nLift it up in Jesus' Name.\n\nStand firm for Christ our Savior!\nHe calleth to the fray;\nWith Him into the battle,\nGo forth, ye soldiers all!\nShow forth that ye are valiant,\nContending against sin;\nThe enemy is mighty,\nYet Christ is without peer.\n\nStand firm for Christ our Savior!\nThe strength belongs to Him;\nThe arm of flesh is feeble,\nUnfaithful and undone.\nArrayed in holy armor,\nWatch constantly in prayer;\nFor duties and for dangers\nDemand enduring zeal."
  },
  "610": {
    "title": "Awake",
    "lyrics": "Awake, awake, O Christians!\nCast off your fatal sleep,\nFor the cruel foe lies in ambush,\nAnd would lead you in captivity;\nAwake, for the darkness is ended;\nNo longer are ye children of the night,\nFor ye are of the light and the day,\nAnd it is your calling to fight.\n\nAwake and brighten your weapons,\nGird up your loins with the truth,\nAnd shod your feet in readiness\nWith the glad Gospel of peace.\nEnough of the darkness of shadow,\nEnough of this deadly sloth;\nArray, array your breastplate\nWith the mail of faith and of love.\n\nThe glorious armor of Jesus,\nHaste ye with longing to take,\nTrusting that no dart of the enemy\nCan shatter it or pierce through.\nO Christian, light of the world,\nTake the helmet of hope on your brow;\nBuckle on the shield of faith,\nAnd fearless hasten to fight.\n\nFear not, for clad in God's armor,\nWhat foe can vanquish our host,\nIf ye take for your sword the Scriptures,\nThe true Word of God from above.\nIn Jesus ye'll find your standard,\nIn Jesus your Captain supreme;\nIn heaven ye'll gain the crown:\nTo the fight, to the fight, to the fight!"
  },
  "611": {
    "title": "The Children Belong to Christ",
    "lyrics": "The children belong to Christ,\nHe is their Savior kind;\nThey are jewels most precious,\nPurchased by His great love.\n\nChorus: Jewels, jewels, jewels, jewels,\nJewels of the Savior;\nThey abide upon this earth\nAs light and gentle love.\n\nThe children are a treasure,\nFor they are from above;\nA radiant light they scatter\nIn hours of distress.\n\nThe children are like stars,\nOf pleasant clarity;\nJesus would have them herald\nTo all the world His truth.\n\nThe children belong to Christ,\nFor them He soon shall come;\nAnd with Him then forever\nIn blessedness they'll dwell."
  },
  "612": {
    "title": "Holy, Holy, Holy",
    "lyrics": "Holy, Holy, Holy!\nLord God omnipotent,\nEvermore my lips\nShall praises give to Thee.\nHoly, Holy, Holy!\nReverently I adore Thee,\nFor Thou hast forgiven\nAll mine iniquity.\n\nHoly, Holy, Holy!\nIn an exalted choir,\nAll the chosen saints\nAdore Thee without cease;\nFilled with joy celestial,\nNow their crowns of gold\nThey cast before the Throne,\nGlorious of the Lord.\n\nHoly, Holy, Holy!\nThe immense multitude\nOf angels that fulfill\nThy holy, blessed will;\nBefore Thee\nBoweth down with fullest certitude\nThat Thou art the Way,\nThe Life, and the Truth.\n\nHoly, Holy, Holy!\nThough Thou art veiled from sight,\nAnd impossible it be\nThy glory to behold;\nHoly art Thou alone,\nThere is none beside Thee\nIn power that equals Thy\nDivinity.\n\nHoly, Holy, Holy!\nThe work of Thine own fingers\nAre the moon and stars,\nThe sky, the earth, and sea;\nHoly, Holy, Holy!\nThou makest man anew\nThat he may worship Thee\nIn spirit and in truth."
  },
  "613": {
    "title": "Hear, O Jehovah",
    "lyrics": "Hear, O Jehovah, this song of my soul;\nI would, O Lord, Thy holy Name praise,\nAnd proclaim Thy heavenly Kingdom,\nAnd so with joy to sing\nA song of victory.\n\nCHORUS: /:/Now joyful do I live, singing unto\nThe Lord/:/\nMy pilgrim journey\nRight soon will pass away,\nAnd joyful with the angels\nMy soul shall sing in praise.\n\nHear, O Jesus, my soul shall praise Thee;\nI would exalt Thy peerless Name,\nThy great power I long to proclaim,\nAnd so with joy to sing\nA song of victory.\n\nHear, O Lord, to Thee I'll give praise;\nA song of love to Thee I would raise,\nAnd gaze upon Thy heavenly Throne,\nAnd so with joy to sing\nAn angel choir on high."
  },
  "614": {
    "title": "I Have Found a Faithful Friend",
    "lyrics": "I have found a faithful Friend,\nMy beloved Savior Lord,\nI will tell what He hath done unto me;\nFinding me when I was lost,\nAn unworthy sinner vile,\nHe hath saved and kept me now for His own.\nHe doth save me from all sin,\nHe doth shield from Satan's power,\nHe hath promised to be with me to the end, hallelujah.\nHe doth comfort all my grief,\nTaketh every care away,\nGreat things Christ hath done for me.\n\nJesus faileth me no more,\nNever will He leave my side;\nHe is my strong and mighty protector;\nFrom the world I turn away and from every vanity,\nConsecrating all my life to the Lord.\nThough the world should me pursue,\nThough in trials I be tried,\nTrusting in my Christ I can endure, hallelujah.\nSure the victory shall be,\nAnd He is my joyous song,\nGreat things Christ hath done for me.\n\nI know that Jesus Christ will very soon return,\nAnd meanwhile He prepareth my home\nIn the dwelling of my Father,\nMansion fair of light and peace,\nWhere the faithful believer forever shall dwell.\nBearing me into His glory,\nNo more sorrow shall I know,\nI shall gaze upon His countenance there, hallelujah;\nWith the saints redeemed from earth, joyfully I then shall sing,\nGreat things Christ hath done for me."
  },
  "615": {
    "title": "One Morning My Life Was Illumined",
    "lyrics": "One morning shone over my life\nThe glorious light of the eternal God;\nAll of the darkness from my soul was gone,\nAnd now I rejoice in the dawning of day.\n\nChorus: I too will give praise to my God,\nWith the angels of heaven;\nIn the fragrant mornings\nI will sing to my Creator.\n\nIn the mornings, when awaking,\nThe redeemed give praise to God;\nAll unite in tender prayer,\nAnd lift up choruses with fervor great.\n\nFilled with great joy is my soul as I sing,\nIn the mornings, when awaking;\nE'en the flowers overflow with love,\nAnd breathe their soft perfume to God.\n\nOn the mountains of my soul was heard,\nA new song that was sweet perfume to God;\nAll of my guilt He forgave unto me,\nWith living water Christ washed me clean.\n\nWater to wine did Jesus turn\nWhen at the wedding His hour was come;\nThus also my life did He transform,\nAnd with His blood He washed my soul.\n\nThe azure sky my Lord adorned\nWith the stars, the moon, and the sun;\nThus also my soul did He transform,\nHe took all the stains from my heart away."
  },
  "616": {
    "title": "Now, O Lord",
    "lyrics": "Now, O Lord,\nSince I draw near beside Thee,\nSorrow hath fled from this heart of mine;\nMy cup overfloweth with Thy rich blessings,\nWherefore I praise Thee, O Blessed Lord.\n\nChorus: Guide me, O Christ, yea, guide me,\nGuide me, O Lord, close to Thee.\nClose to Thee,\nYea... guide Thou me,\nLet naught of the world part my soul from Thee.\n\nBeauteous the pathway that Thou hast marked out for us,\nThere is no other way where sweet peace can be found;\nThou art the Fountain of Living Water,\nAnd glorious pathway of light and of truth.\n\nMy soul doth rejoice in Thy grace so divine,\nWith exceeding great joy I render Thee praise;\nThy love hath filled every void in my spirit:\nThy Holy Spirit enkindleth my soul.\n\nMy longing is to reach that celestial City\nWhere all of the sorrow and pain have an end;\nThere shall be no weeping, nor anguish, nor dying,\nThere only Thy peerless love doth reign."
  },
  "617": {
    "title": "The Lord Did All for Me",
    "lyrics": "All things the Lord hath done for me,\nI will not cease to love Him;\nAnd by His grace I was made free,\nI will not cease to love Him.\n\nChorus: I will not cease to love Him,\nHe saves me, He saves me,\nAnd I will not cease to love Him,\nFor He hath died for me.\n\nIf I am strong, I owe't to Him,\nI will not cease to love Him;\nMy steps He guideth unto Him,\nI will not cease to love Him.\n\nThough the world never loveth Him,\nI will not cease to love Him;\nHe is my Friend and Savior dear,\nI will not cease to love Him.\n\nWhile in His pathway I walk on,\nI will not cease to love Him;\nAnd since I know to His realm I go,\nI will not cease to love Him."
  },
  "618": {
    "title": "We Praise Thee, O God",
    "lyrics": "We praise Thee, O God,\nWith unanimous voice,\nFor in Jesus Thy Son\nThou hast granted us pardon.\n\nChorus: Hallelujah! We praise Thee,\nHow great is Thy love!\nHallelujah! We adore Thee,\nO Blessed Lord.\n\nWe praise Thee, Lord Jesus,\nWho Thy throne of bright light\nDidst leave to bestow\nRedemption on the cross.\n\nWe give Thee our praise,\nO Divine Lord above,\nWho dost fill us with joy\nAnd with courage divine.\n\nUnited give praise\nTo the God of all grace,\nWho is the fountain of mercy,\nOf virtue and truth."
  },
  "619": {
    "title": "How Glorious Shall Be the Morning",
    "lyrics": "How glorious shall be the morning\nWhen Jesus the Savior shall come,\nWhen nations united as brethren\nA welcome shall give to the Lord.\n\nChorus: There shall never be need\nOf the brightness of light,\nNor shall the sun give its rays,\nNor its warmth any more;\nThere shall be no more weeping,\nNor sorrow, nor pain,\nFor then Jesus, the King of all glory,\nForever the Comforter will be.\n\nWe wait for that glorious morning\nTo welcome the God of all love,\nWhen He cometh in the clouds\nFor His bride,\nWe shall render our praise to the Lord.\n\nThe Christian both faithful and steadfast,\nAnd also the laborer true,\nAnd the Church, the Lamb's bride ever holy,\nShall rest in the arms of the Lord."
  },
  "620": {
    "title": "By Faith I Shall Attain Eternal Life",
    "lyrics": "By faith I shall obtain eternal life,\nThe fiercest tempests I shall overcome;\nFor Jesus blotteth out my grief and strife,\nBy faith His face in glory I shall see.\n\nChorus: By faith I shall behold,\nBy faith I shall await,\nBy faith I shall enjoy\nEternal life.\n\nO sweet and wondrous hope,\nIt cheereth my soul,\nTo dwell within the arms of tender Jesus;\nIn triumph I shall bear the crown and palm,\nDwelling in heavenly mansions of light.\n\nLord, pardon Thou my frailties and my weakness,\nThat I through faith may come forth victor-crowned;\nMay I never return to deeds of darkness,\nThe glory of the life I left behind.\n\nLord, if perchance my faith should faint within me,\nLord, I beseech Thee, increase Thou my faith;\nThat I may cross the raging sea,\nAnd reach Thy shore;\nBe ever, O my Jesus, a faithful Pilot.\n\nI have my confidence in Jesus Christ,\nThat I am justified through saving faith;\nBy faith I shall behold what I have not seen,\nBy grace am I saved, and through faith."
  },
  "621": {
    "title": "Bearing the Cross of Christ",
    "lyrics": "To bear the cross of Christ\nIs sorrowful at times,\nYet God hath well provided\nThe pathway of His love.\n\nChorus: Grant unto me, Lord Jesus,\nTo reach Thy heavenly mansion,\nA place of holy, perfect light,\nA city of rich blessing.\n\nThe glory of Mount Calvary\nWas the crucifixion;\nThey pierced His blessed side\nFor our rebellion.\n\nThe law of His holy Word\nKnoweth no variation;\nRather it is the journey\nUnto salvation.\n\nDivine and blessed hope\nFor all humanity,\nHe poured in rich abundance,\nLike light in radiant clarity."
  },
  "622": {
    "title": "Jesus Is My Refuge",
    "lyrics": "Jesus is my refuge\nIn every tempest wild,\nAnd He is the firm Rock\nOf all eternity.\nThe wind shall never move me,\nNor snatch me from His hand;\nJesus is my refuge,\nJesus is my refuge,\nNothing shall I lack.\n\nThe turbulent, wild billows\nCast themselves over me,\nAnd darkest nights of sorrow\nBegin to cover me;\nMy bark is sailing onward,\nUnto the haven drawn;\nJesus is my Pilot,\nJesus is my Pilot,\nNo harm shall come to me.\n\nJesus is the Friend\nWho giveth quiet rest,\nAnd He is the medicine\nFor every malady.\nI will not fear the battle,\nFor He will keep my soul."
  },
  "623": {
    "title": "I Only Await That Day",
    "lyrics": "I only wait for that day,\nWhen Christ shall come again;\nI only wait for that day,\nWhen Christ shall come again.\nAll care and all of my labor\nFor me shall have an end,\n/:/When Christ shall come again,/:/\nAnd to His Kingdom take me home.\n\nNo longer care I if the world\nDespise me everywhere,\nFor I am no more of this world,\nI belong to the realm above.\nI only wait for that day\nWhen I shall rise again,\n/:/From out the chilly grave\nWith a body immortal then/:/\n\nThen in triumph there above,\nVictorious I shall ascend;\nUnto Jesus Christ in the clouds,\nFace to face Him I shall see.\nThere shall be no more cares,\nNor any grief for me,\n/:/With all the redeemed of God,\nThe Lamb I shall ever praise/:/\n\nAt the sounding of the trumpet,\nFrom heaven He shall descend;\nThose who have slept in Jesus,\nHe then shall wake from death.\nWe who are yet alive\nShall be transformed by Jesus,\n/:/In a body glorified\nAnd immortal, filled with light/:/"
  },
  "624": {
    "title": "I Feel Exceeding Glad",
    "lyrics": "I feel exceeding glad\nWith Christ my blessed Lord,\nBecause He healed my body\nFrom grievous malady.\nI have a testimony\nSo wondrous to recount:\nI live by a great miracle\nThrough Christ, my blessed Lord.\n\nOne day, so sorely sick,\nI sought to take away,\nTo take my very life away,\nBeholding my sad state.\nI felt no ease nor healing\nWithin my suffering frame,\nUntil, in His rich grace,\nHe had compassion on me.\n\nOne morning, at the dawn,\nMy heart within me felt\nThat something soon would come to me\nEven as a blessing from above.\nBefore my very doorway\nA man was standing there;\nThey were beloved brethren\nSpeaking salvation's word.\n\nThen one of them knelt down\nAnd bowed himself in prayer,\nBeseeching God to have\nCompassion on my soul.\nThe other one was saying:\n“Hear Thou my earnest prayer,\nLook not upon our works,\nForgive him, blessed Lord.”"
  },
  "625": {
    "title": "Alone to the Garden I Go",
    "lyrics": "Alone to the garden I go,\nWhile the woodland is quietly sleeping;\nAnd in stillness and peace\nWith my Jesus I stay,\nEntranced as I hear His sweet voice.\n\nChorus: He is with me there,\nI can hear His voice,\nAnd He tells me I am His own;\nAnd the joy that I find with my Savior there,\nNone other can ever share.\n\nSo sweet is the voice of the Lord,\nThat the birds in the branches keep silence;\nAnd alone is there heard that sweet voice of His love,\nWhich giveth great peace to the soul.\n\nEnchanted with Him I would stay,\nThough around me\nThe shadows are falling;\nYet He biddeth me go,\nAnd I hasten to hear\nHis voice wheresoever is grief."
  },
  "626": {
    "title": "Speak to Me, Lord",
    "lyrics": "Speak to me, O Lord,\nFor I am sleeping;\nThat I may ever serve Thee,\nFaithful and true;\nThat I at Thine altar\nMay ever be ministering,\nAnd serve in Thy temple as Samuel.\n\nCHORUS: Awaken me from slumber to hear Thee,\nAnd give me the heart of King David;\nThat I, even as Samuel,\nMay answer Thee:\n“Speak, Lord, for Thy servant heareth;\nHere am I.”\n\nSend me forth, O Lord, with Thy message,\nAnd give me the oil of Thine anointing,\nTo bear Thy holy Word\nUnto every place;\nAnd I shall have Thy blessing,\nEven as Samuel.\n\nSpeak into mine ear that I awaken,\nAnd I, even as Samuel, will answer;\nIf I can be of service\nEven unto death,\nCommand what Thou wilt,\nAnd I will do it."
  },
  "627": {
    "title": "Friend, What Is Thy Destiny?",
    "lyrics": "Friend, what is thy destiny?\nKnowest thou the path whereon thou walkest?\nGreat is the danger;\nTake heed! For this very day\nThou mayest ponder it.\n\nChorus: /:/There are only two pathways,\nWhich one wilt thou choose?\nChoose thou the path of Christ,\nFor He is the Way,\nThe Life, and the Truth/:/\n\nThe path without Christ is broad;\nOn one side standeth the hospital,\nOn the other side is the prison,\nAnd at the end of the way,\nEternal death.\n\nStrong drink, revelry, and banqueting,\nIs that all thou desirest to find?\nIn these there is only delusion;\nTake heed! For this very day\nThou oughtest to ponder it.\n\nThe pathway of Christ is narrow,\nThere is no place to work iniquity;\nPrison and lamentation are unknown,\nAnd over all sin\nHe maketh us to triumph.\n\nNarrow is that ancient path,\nThe pathway of life and of peace;\nIt leadeth the soul unto Heaven,\nWhere forever reigneth\nJoy and felicity."
  },
  "628": {
    "title": "Our Father",
    "lyrics": "Our Father,\nOur Father,\nThou hast promised to succor\nThe weary one, O Lord;\nSuffer not, O my God,\nMy soul to be lost,\nNay, O God divine.\n\nChorus: In the trial and in the conflict,\nOr in tribulation,\nComfort Thou wilt give us.\n\nOur Father,\nOur Father,\nToday we ask Thee for comfort\nIn our deep affliction,\nThou who ever dost keep us,\nThou who hast delivered us,\nYea, from temptation.\n\nEternal God,\nEternal God,\nThou who comfortest the feeble\nAnd givest him strength;\nWhen in sorrow he wandereth,\nThou impartest him comfort,\nYea, to press onward."
  },
  "629": {
    "title": "Only the Power of God",
    "lyrics": "Only the power of God\nCan transform thine inner being;\nThe proof I give to thee:\nHe hath transformed my life.\nDost thou not see my joy,\nFollowing the Lord?\nA new creature am I, made anew.\n\nThe Name of my great God\nIs Jesus Christ the King;\nThere is no other name\nWhereby we may be saved.\nDost thou not see my joy,\nAnd how secure I stand?\nBecause the Lord Jesus\nIs my God.\n\nIf thou wouldst happy be,\nReceive Christ the King;\nThere is no other name\nWhereby we may be saved.\nDost thou not see my joy?\nFor I have been baptized\nIn the Name of Jesus,\nI am saved."
  },
  "630": {
    "title": "O God, Thou Art My God",
    "lyrics": "O God, Thou art my God;\nEarly in the morning will I rise to Thee,\nTo behold Thy glory and Thy power,\nEven as I have seen Thee in Thy sanctuary.\n\nO God, Thou hast been my stay\nIn this dry and weary land;\nYet better is Thy lovingkindness than this life,\nTherefore shall my lips forever praise Thee.\n\nMy soul cleaveth unto Thee,\nMy soul shall be satisfied with Thy beauty;\nUnder the shadow of Thy wings I triumph,\nI will lift up my hands forever in Thy Name.\n\nEven when asleep I will remember Thee\nAnd Thy mighty deeds;\nI will meditate, I will rejoice beholding Thy glory,\nThou art my glory, O Almighty God.\n\nO God, Thou art my God;\nEarly in the morning will I rise to Thee,\nTo behold Thy glory and Thy power,\nEven as I have seen Thee in Thy sanctuary."
  },
  "631": {
    "title": "The Cry of My People",
    "lyrics": "The cry of My people hath reached Me,\nNow am I ready to go seek them out,\nWhen all love each other as brethren\nAnd within the church cease from their strife.\n\nChorus: O brother, who speakest against thy brother,\nO brother, who speakest against the pastor,\nDost thou think thus to reach unto heaven,\nWithout peace, without kindness, without love?\n\nPastor, who watchest for souls,\nThee also would I earnestly exhort:\nThat thou correct such ones in My Church,\nFor of her thou must give Me an account.\n\nI admonish that all be prepared,\nWatching in fasting and in prayer;\nI, the LORD of the heavens, am He that speaketh\nOn this day to the whole congregation.\n\nI am Holy, and I dwell among the holy;\nWhere there is peace and love, there dwell I;\nWhere grudges and grievances harbor,\nThere the Spirit of God abideth not."
  },
  "632": {
    "title": "Christ Is Seeking Laborers",
    "lyrics": "Christ is seeking laborers today,\nWho will go forth with Him;\nWho will say: “Lord, I will go with Thee,\nFaithful to Thee I'll be”?\n\nChorus: O Lord, abundant is the work,\nAnd laborers are few;\nGrant us light, fervent faith, and courage,\nAnd laborers there shall be!\n\nChrist desireth messengers today,\nTo publish forth His truth;\nWho will say: “Lord, ready now am I,\nThy holy will to do”?\n\nThere is room if thou wouldst labor on,\nIn the harvest field of Christ;\nThou canst tell the world of all His glory,\nHis goodness and His love.\n\nThou livest now redeemed by Jesus,\nKnowest thou His love today?\nSpeak then, and proclaim that in the light\nOf Christ thou now dost live!"
  },
  "633": {
    "title": "If I Have Wounded Any Soul, O Christ",
    "lyrics": "If I have wounded any soul, O Christ,\nIf through my fault the weak hath gone astray,\nIf in Thy footsteps I have failed to walk,\nForgive, I pray Thee, O my Lord and God.\n\nChorus: Hear Thou, O God, my humble, contrite prayer,\nAnd keep me from temptation's subtle snare;\nPreserve my soul forever in Thy fold,\nForgive, I pray Thee, O my Lord and God.\n\nIf vain and idle hath my speaking been,\nIf him who suffered in his grief I left,\nCondemn me not according to my sin,\nForgive, I pray Thee, O my Lord and God.\n\nIf foolish and neglectful I have been,\nAnd my appointed duty left undone,\nRepentant now I come before Thy face,\nForgive, I pray Thee, O my Lord and God."
  },
  "634": {
    "title": "For Me He Suffered on a Cross",
    "lyrics": "For me He suffered on a cross, my blessed Master,\nNailed in His hands and feet without compassion shown,\nTo preach the word and save the lost and fallen;\nI have full knowledge in my soul\nThat He hath suffered for me.\n\nChorus: His holy love... is great and without\nEqual, His life\nHe gave without condition, to save the sinner.\n\nHe was wounded to the heart by a soldier,\nWho took advantage of my Lord's condition,\nWhen He pleaded for that pardon from the Father,\nThence sprang redemption, yea, redemption for me.\n\nHe suffered too because He healed the sick and ailing,\nHe comforted and lifted them in tender love,\nYet from that place was He led forth to Calvary,\nAnd I do know myself a debtor, for He suffered\nFor me."
  },
  "635": {
    "title": "Christ Is the Rock",
    "lyrics": "Never forget that in the world there is a sea\nThat would engulf and overwhelm thy life,\nYet thou hast a Friend, and Jesus is His Name;\nHe will succor thee.\nIf in perils or conflicts thou art found,\nCry unto Him, He will succor thee;\nHe is Jesus my Savior /:/ Hide me, O hide me.\n\nChorus: Christ is the Rock of mighty power,\nHide me, O hide me, hide me,\nWhile passeth by, O Lord, the raging\nTempest,\nHide me, O hide me by Thy power, Lord.\nChrist is the Rock of mighty power\nWho will calm the raging storm;\nThou art Jesus, my Savior,\nHide me, O hide me.\n\nIf sore trials torment thee cruelly,\nAnd it seemeth thou art about to perish,\nNever forget to cry aloud\nUnto the Savior, He will succor thee;\nWith His arm of mighty power\nHe will give thee strength to overcome;\nThou art Jesus, my Savior, hide me, O hide me."
  },
  "636": {
    "title": "O Divine Redeemer",
    "lyrics": "O Divine Redeemer, hear my plea,\nLeave me not, O leave me not to perish;\nI await Thy help, O Holy God,\nForget me not, forget me not, I pray.\n\nChorus: Lord, Lord, let Thine ears be attentive\nTo the voice of my cry, and grant an answer,\nAccording as Thy will may be.\n\nO precious Benefactor, increase in me\nThis joy, this spiritual rejoicing;\nSuffer me not one day to draw back\nAnd turn again after iniquity.\n\nO blessed Savior, teach Thou me\nHow I ought, how I ought to walk;\nLet Thy Word be a lamp unto my path,\nAnd enlighten the way where I should go.\n\nO blessed God of love, grant unto me\nThat I may, that I may finish\nMy race in perfect holiness,\nFor I long to arrive where Thou art."
  },
  "315 A": {
    "title": "One Night I Dreamed",
    "lyrics": "One night I dreamed even thus:\nThat my Christ was coming for me.\nOh, what joy my soul did feel,\nThrough His grace that my soul attained.\n\nChorus: And standing upon the seashore,\nI lifted mine eyes to heaven and beheld\nJesus who was coming for me,\nAnd my soul went away with Christ.\n\nUpon waking from my dream right there,\nOn my knees I fell in prayer;\nGiving thanks unto my Savior,\nFor His grace that He imparted to me.\n\nNow I live thinking on His love,\nAwaiting that day which I saw,\nIn the clouds for my soul He shall come,\nAnd forever with Him I shall be."
  },
  "315 B": {
    "title": "When the Servants",
    "lyrics": "When the servants go journeying on;\nSilhouettes that through the desert\nCry aloud now, cry aloud now,\nAnd prepare the pathway of the Lord.\n\nChorus: The servants who preach today with a loud voice,\nAre worthy of great honor, saith the Lord;\nIf perchance amidst struggles they seem to falter,\nHelp Thou them,\nHelp Thou them, Master, yea, help Thou them;\nThy rod and Thy staff shall give them courage,\nIf even now they are Thy servants, my Lord,\nHelp Thou them.\n\nWhen the servants of Jesus Christ\nLift high the glorious banner\nOf peace, of love,\nMy heart also is deeply moved.\n\nThe suffering and wandering feet\nOf the servants of the Living God,\nAre coming now, are coming now,\nTo surrender their sheaves unto the Lord."
  },
  "E1": {
    "title": "I Am Glad Because I Belong to Christ",
    "lyrics": "I am glad because I belong to Christ,\nI am glad because I belong to Christ,\nI am glad because I belong to Christ,\nHallelujah, glory to Him!\n\nChrist is my all, my all in all to me,\nChrist is my all, my all in all to me,\nHe is my Friend, He is my brother, He is my joy,\nHe is my life, He is all in all to me."
  },
  "E2": {
    "title": "Thou Art Worthy of Glory",
    "lyrics": "/:/Thou art worthy of glory and honor,\nWe lift up our song of praise\nIn Thy Name, Lord Jesus/:/\n\n/:/Most High, Thou wonder-working Savior,\nThere is none like unto Thee,\nThere is none like unto Thee/:/"
  },
  "E3": {
    "title": "Now I Am Saved",
    "lyrics": "Now I am saved, now I am saved,\nHallelujah! Now I am saved;\nMy guilt and all my sins\nBy Christ are blotted out,\nHallelujah! Now I am saved."
  },
  "E4": {
    "title": "And When We Are Yonder with Christ",
    "lyrics": "And when we are\n/:/Yonder with Christ/:/\nThere shall be no more weeping nor sorrow\n\nNor any pain;\nAnd when we the redeemed are\nYonder with Christ,\nWe shall give glory and honor unto Him."
  },
  "E5": {
    "title": "I Have a Crown Yonder with Christ",
    "lyrics": "I have a crown yonder with Christ,\nIf faithful I persevere unto the end;\nTherefore I go fighting the battle,\nAnd running in the race of faith.\nAnd when I finish my course,\nThe Lord Jesus Christ shall say unto me:\n/:/ “Come unto Me, O blessed of My Father!\nInherit the Kingdom prepared for thee”. /:/"
  },
  "E6": {
    "title": "If Joy Be Felt Here",
    "lyrics": "If joy is felt here,\nAt this sacred altar;\nIf joy is felt here\nWhere we are gathered.\nIf joy is felt here\nWhat shall it be yonder in Heaven\nWhen I arrive with Christ,\nFace to face I hope to see Him!"
  },
  "E7": {
    "title": "In This Gathering Christ Is Present",
    "lyrics": "In this gathering Christ is present.\nHe hath promised unto His flock,\nWhere two or three in My Name shall be,\nI will be there, I will be there, I will be there,\nI feel Him here, I feel Him in me.\nHis Spirit makes me sing\nI feel Him here, I feel Him in me,\nHis Spirit makes me tremble."
  },
  "E8": {
    "title": "Renew Me, Lord",
    "lyrics": "Renew me, Lord Jesus, I no longer want to be the same\nRenew me, Lord Jesus, place within me Thy heart;\n\n/:/ For all that is within me\nNeeds to be changed, Lord,\nFor all that is within my heart\nNeeds more of Thee /:/"
  },
  "E9": {
    "title": "I Came to Worship God",
    "lyrics": "/:/ I came to worship God /:/\nI came to worship His Name,\nI came to worship God.\n\nHe came into my life\nOn a very special day,\nHe changed my heart,\nHe taught me a better way\nAnd this is the reason why I sing...\n\nI came to praise God...\nI came to praise His Name,\nI came to praise God..."
  },
  "E10": {
    "title": "My Christ, Thou Hast Saved Me",
    "lyrics": "My Christ, Thou hast saved me\nThine I am, Thine I shall be;\nThrough Thy shed blood\nEternal life I shall enjoy.\nGlory, glory, hallelujah!\nGlory, glory to Jesus!\nNow I am cleansed by His blood,\nGlory, glory to Jesus!"
  },
  "E11": {
    "title": "O Lord, I Want All My Being to Burn Today",
    "lyrics": "O Lord, I want all my being to burn today,\nLike the bush I want to burn with Thy power.\nIn other tongues I want to speak as a sign,\nTo be burning with the spiritual fire;\nI want to sing unto Thee and worship Thee, O Jehovah!\nAs one worships in Spirit and in truth;\nI want all my being to burn, O Lord!\nLike the bush I want to burn with Thy power.\n\nMay the joy never end\nThat is in my heart;\nMay it never come to an end,\nMay it continue more and more and more."
  },
  "E12": {
    "title": "My Jesus Cometh Now",
    "lyrics": "He cometh now; He cometh now\nMy Jesus cometh now, cometh now;\nClothed in glory and majesty,\nIn the clouds my Jesus cometh now.\nHe cometh now, He cometh now,\nMy Jesus cometh now, cometh now\nFor His people who love Him in truth,\nIn the clouds my Jesus cometh now."
  },
  "E13": {
    "title": "Send the Fire, Lord",
    "lyrics": "Send the fire, Lord,\nSend the fire\nAnd revive us with Thy power,\nSend the fire, Lord,\nAnd revive us with Thy courage;\n/:/ Quench ye not /:/\nThe Holy Spirit of God,\nBy His grace and power,\nThe victory ye shall obtain,\nAnd with joy ye shall serve Jesus."
  },
  "E14": {
    "title": "I Have a Friend Who Loves Me",
    "lyrics": "I have a Friend who loves me,\nHe loves me, He loves me;\nI have a Friend who loves me,\nHis Name is Jesus.\n\nI have a Doctor who heals me,\nHe heals me, He heals me;\nI have a Doctor who heals me,\nHis Name is Jesus.\n\nI have a Teacher who teaches me,\nHe teaches me, He teaches me;\nI have a Teacher who teaches me,\nHis Name is Jesus."
  },
  "E15": {
    "title": "I Am Glad, Glad, Very Glad",
    "lyrics": "I am glad, glad, and very glad,\nI am glad because glad am I;\nI am glad, glad, and very glad,\nI am glad because Christ saved me.\nI am joyful, joyful, and very joyful,\nI am joyful because joy have I;\nI am joyful, joyful, and very joyful,\nI am joyful because Christ saved me."
  },
  "E16": {
    "title": "O Fire, Come",
    "lyrics": "O fire, come! O fire, come!\nKindle the congregation,\nKindle now my heart,\nO fire, come! O fire, come!\nO fire, come!"
  },
  "E17": {
    "title": "Yonder on Mount Horeb",
    "lyrics": "Yonder on Mount Horeb the bush was burning,\nYonder on Mount Horeb the bush was burning.\nMoses desired to know why the bush was burning\nAnd was not consumed, he desired to know.\nHe heard a voice from Heaven saying unto him:\n/:/ Put off, put off the sandals from thy feet,\nFor the place whereon thou treadest is Holy Ground /:/"
  },
  "E18": {
    "title": "The Spirit of God Is in This Place",
    "lyrics": "/:/ The Spirit of God\nIs in this place\nThe Spirit of God\nIs moving in this place\nHe is here to comfort,\nHe is here to deliver,\nHe is here to guide\nThe Spirit of God is here /:/\n\n/:/ Move in me, move in me,\nTouch my mind, my heart,\nFill my life with Thy love\nMove in me, Holy Spirit,\nMove in me /:/\n\n/:/ Move in me, Holy Spirit,\nMove in me /:/"
  },
  "E19": {
    "title": "If You Are Truly Saved, Say Amen",
    "lyrics": "If you are truly saved, say amen, amen.\nIf you are truly saved, say amen, amen.\nIf you are truly saved, testify with your life,\nIf you are truly saved, say amen, amen."
  },
  "E20": {
    "title": "Send the Rain, Copious Rain",
    "lyrics": "Send the rain, copious rain,\nRain of great power.\nSend the rain, copious rain,\nSend it once again."
  },
  "E21": {
    "title": "Send Thy Power, Lord",
    "lyrics": "Send Thy power, send Thy power,\nSend Thy power, Lord.\nSend Thy power, send Thy power,\nSend Thy power, Lord."
  },
  "E22": {
    "title": "After the Storm",
    "lyrics": "After the storm,\nCometh the calm, cometh the peace.\nIf unto Christ upon thy knees\nThou askest it, He will give it thee;\nIt matters not that legions\nOf the enemy cause thee to suffer,\nAt the Name of my Christ,\nSacred Name,\nThey shall have to flee."
  },
  "E23": {
    "title": "For These Favors",
    "lyrics": "For these favors which Thou hast done for us,\nWe give Thee thanks; O good Savior!;\nFrom Thy good hand Thou givest us food.\nOf Thee is life and also health,\nAnd therefore we praise Thee, O good Father God!"
  },
  "E24": {
    "title": "Great and Marvelous Are Thy Works",
    "lyrics": "Great and marvelous are Thy works,\nLord God Almighty,\nJust and true are Thy ways,\nKing of saints,\nWho shall not fear Thee, O Lord,\nAnd glorify Thy Name,\nFor Thou only art holy.\nFor all nations shall come\nAnd worship before Thee,\nFor Thy judgments are made manifest."
  },
  "E25": {
    "title": "Lift Up Your Heads, O Ye Gates",
    "lyrics": "Lift up your heads, O ye gates,\nAnd be ye lifted up, ye everlasting doors,\nAnd the King of Glory shall come in.\nWho is this King of Glory?\nThe LORD, strong and mighty,\nThe LORD, mighty in battle,\n/:/ The LORD of hosts /:/\nHe is the King of Glory;\nHe is the King of Glory."
  },
  "E26": {
    "title": "He Is Here",
    "lyrics": "/:/ He is here, He is here,\nHallelujah, the Lord is here /:/\n\n/:/ I feel Him in me, I feel Him in me,\nHallelujah, the Lord I feel in me /:/"
  },
  "E27": {
    "title": "More Sublime Than the Heavens",
    "lyrics": "Jesus, King of the universe  \nJesus, King of my heart  \nThy hands created the earth  \nThe seas and also the sun\n\nCHORUS:  \n/:/ Jesus, Thou art sublime  \nJesus, my King eternal  \nFrom dust Thou hast formed us  \nFor Thy glory and majesty /:/"
  },
  "E28": {
    "title": "If in This Gathering",
    "lyrics": "If in this gathering  \nThere is peace among us  \nAnd our hearts are  \nKnit together by love\n\n/:/ God shall send His blessing  \nGod shall send His blessing  \nGod shall send His blessing  \nAnd life everlasting He shall send /:/\n\nBehold, how good it is  \nTo dwell in harmony  \nLet us unite our souls as one  \nAnd form the temple of the Lord"
  },
  "E29": {
    "title": "A Touch of Thy Love",
    "lyrics": "/:/ Standing before Thee  \nKneeling in Thy presence,  \nI long to touch Thy heart,  \nI long to lose myself in Thee  \nBlessed God of love  \nWithout Thee I am nothing  \nHelp me to live /:/\n\n/:/ I long to touch Thy heart  \nAnd through Thee be an overcomer  \nOh! My Jesus, a touch of Thy love  \nI long to feel Thee today /:/"
  },
  "E30": {
    "title": "Blessed Be the Lord God",
    "lyrics": "Blessed be the Lord God Almighty  \nWho was, and is, and is to come  \nBlessed be the Lord God Almighty  \nForever He shall reign\n\nFather in Heaven, we adore Thee  \nWe lift Thy Name on high today  \nLet Thy Kingdom be established  \nIn the praise  \nLet Thy people declare Thy power"
  },
  "E31": {
    "title": "Worthy of Honor and Majesty",
    "lyrics": "Today we are here  \nTo give Thee praise  \nToday we are here  \nTo render Thee honor\n\n/:/ For Thou art a God of power  \nFor Thou art a God of truth  \nNone equals Thy greatness and beauty  \nWorthy of honor and majesty /:/"
  },
  "E32": {
    "title": "Thou Alone Art Holy",
    "lyrics": "/:/ Thou alone art Holy  \nThou alone art Worthy  \nThou art Beautiful  \nAnd Wonderful /:/\n\n/:/ Pour out Thy Spirit  \nAnd let Thy Light shine  \nLet Thy Glory fill  \nEven now this place /:/"
  },
  "E33": {
    "title": "There Is an Anointing Here",
    "lyrics": "/:/ There is an anointing here  \nFalling upon me  \nTransforming me, changing my being /:/\n\n/:/ My spirit and my soul  \nAre being filled  \nWith the power of Thy Holy Spirit  \nMy life shall never be the same /:/"
  },
  "E34": {
    "title": "My God Is Great",
    "lyrics": "So great is God that He can  \nWalk upon the stars  \nTread upon the clouds  \nFor He made all creation  \nHe can walk wherever He wills  \nAll that exists He formed  \nHe gave us the breath of life  \nTo worship the Savior\n\n/:/ My God is great, so great is He...  \nThat high in Heaven He sits enthroned  \nAll the earth He puts beneath His feet  \nGlory to His Name /:/"
  },
  "E35": {
    "title": "Only God Makes Man Happy",
    "lyrics": "/:/ Only God makes man happy /:/\nLife is nothing, all passeth away  \nOnly God makes man happy\n\n/:/ Christ desireth that thou be happy /:/\nHe came into the world to save thee  \nChrist desireth that thou be happy"
  },
  "E36": {
    "title": "Open the Gates, Open",
    "lyrics": "/:/ Open the gates, open  \nLift up your heads  \nOpen the gates, open  \nLift up your heads\n\n/:/ And let the King of Glory enter in  \nAnd let the King of Glory enter in  \nAnd let the King of Glory enter in  \nAnd let the King of Glory enter in /:/"
  },
  "E37": {
    "title": "Though Giants I Encounter",
    "lyrics": "/:/ God did not bring us this far  \nTo turn back again,  \nHe brought us here to possess the land He gave us /:/\n\n/:/ Though the giant be standing there  \nI shall never fear  \nHe brought us here to possess the land He gave us /:/"
  },
  "E38": {
    "title": "God Is Everywhere",
    "lyrics": "/:/ God is everywhere  \nGod is everywhere  \nGod is everywhere  \nHallelujah to Jehovah /:/\n\n/:/ Seek Him in the heavens  \nSeek Him in the sea  \nSeek Him in the mountains  \nAnd there thou shalt find Him /:/"
  },
  "E39": {
    "title": "The Service Has Ended",
    "lyrics": "The service has ended  \nLet us give thanks to God  \nMay Thy Holy Spirit  \nGuide us with fervor\n\nDismiss us in peace  \nThat we may go forth safely  \n/:/ Bless Thou my pathway  \nBefore I depart /:/"
  },
  "E40": {
    "title": "His Spirit Gives Liberty",
    "lyrics": "Where the Spirit of God is  \nThere is liberty, there is liberty  \nWhere the Spirit of God is  \nThere is always liberty\n\nLiberty, liberty  \nLiberty, liberty  \nWhere the Spirit of God is  \nThere is always liberty"
  },
  "E41": {
    "title": "The Man of Galilee",
    "lyrics": "/:/ The Man of Galilee is passing by /:/\n\n/:/ And let Him move  \nAnd let Him move  \nAnd let Him move  \nWithin thy heart /:/\n\n/:/ The Man of Galilee is passing by /:/\n\n/:/ And let Him touch thee  \nAnd let Him touch thee  \nAnd let Him touch thee  \nAnd receive His blessing /:/"
  },
  "E42": {
    "title": "Saint John 3:16",
    "lyrics": "/:/ For in such manner loved  \nMy God the world  \nThat He gave His beloved Son  \nThat whosoever believeth in Him  \nShould not perish, but have everlasting life /:/\n\nFor in such manner He loved me  \nThat He gave Himself for me upon the cross  \nThere He died for thee and for me  \nShedding His crimson blood\n\nFor in such manner He loved me  \nThat He gave Himself for me, the Lord  \nAll my guilt He bore  \nAnd on the cross... My sins He forgave"
  },
  "E43": {
    "title": "Glory to the Lord",
    "lyrics": "Thank Thee for a life of striving  \nThank Thee for letting me walk  \nThank Thee for telling in song  \nWhat in Thee I have learned to sing\n\nThank Thee for granting me friends  \nFull of trust in me  \nThank Thee for mine enemies  \nFor they drew me closer to Thee\n\n/:/ Glory,  \nGlory, glory, glory, glory,  \nGlory, glory, glory, glory,  \nGlory, glory, glory to the Lord /:/\n\nGlory..."
  },
  "E44": {
    "title": "Mercy Is What I Behold in Thee",
    "lyrics": "/:/ Mercy is what I behold in Thee  \nWhereby I am standing here  \nMercy is what I behold in Thee  \nWhich causeth me to be near Thee /:/\n\n/:/ Wherefore have I come to the place of holiness  \nAnd I have not been consumed, though great is my iniquity  \nAnd I know 'tis through Thy tender mercy  \nI give Thee thanks, O Lord /:/"
  },
  "E45": {
    "title": "In His Presence",
    "lyrics": "Enter into the presence of the Lord  \nWith thanksgiving  \nAnd adore Him from the heart  \nEnter into the presence of the Lord  \nWith thanksgiving  \nAnd lift up thy voice with joy\n\nGive glory and honour  \nAnd praises to the Lord  \nOh! Christ, Name beyond compare"
  },
  "E46": {
    "title": "By the Power of Thy Love",
    "lyrics": "I come to Thee, Lord, change me, renew me,  \nBy the grace that  \nI found... In Thee  \nNow I know that the  \nWeaknesses that are in me  \nShall only fade away  \nBy the power of Thy love\n\nCover me  \nWith Thy love, mold me  \nTake me  \nNear I desire to be  \nAnd as I wait  \nNew strength I... Shall have  \nAnd I will mount up  \nLike unto the eagles  \nBy the power of Thy love"
  },
  "E47": {
    "title": "Thank Thee, Christ",
    "lyrics": "/:/ Thank Thee, Christ  \nThank Thee, Christ  \nThank Thee, Christ  \nThank Thee, Christ\n\nWe lift up our hands  \nIn a token of gratitude  \nThank Thee, Christ  \nThank Thee, Christ /:/"
  },
  "E48": {
    "title": "The Blood of Christ",
    "lyrics": "The Blood of Christ hath power  \nTo undo the evil in my being  \nThe Blood of Christ hath power  \nTo undo the evil in my being\n\n/:/ The Blood of my Good Jesus,  \nPrecious crimson Blood,  \nWhich He shed yonder on the cross,  \nHath been sufficient for me /:/"
  },
  "E49": {
    "title": "The Church Keeps Marching On",
    "lyrics": "Oh! Glory, hallelujah,  \nThe Church keeps marching on  \nOh! Glory, hallelujah,  \nThe Church keeps marching on  \nKeeps marching on, keeps marching on\n\nThrough valleys and mountains,  \nThe Church keeps marching on  \nThrough valleys and mountains,  \nThe Church keeps marching on  \nAnd only halts to preach"
  },
  "E50": {
    "title": "Change, Lord, My Life",
    "lyrics": "/:/ Change, Lord, change my life  \nCleanse, Lord, my heart  \nHeal, Lord, today my wounds  \nMy spirit and all my being /:/\n\n/:/ When I have found myself alone,  \nThou hast been my only comfort of love  \nWherefore now I pray unto Thee  \nTo change my life with Thy power /:/"
  },
  "E51": {
    "title": "The Peace of God",
    "lyrics": "The Peace of God be with thee  \nThe Peace of God be with thee  \nThe Peace of God be with thee\n\nAnd forever  \nEver, ever,  \nEver be peace"
  },
  "E52": {
    "title": "Be of Good Cheer",
    "lyrics": "/:/ Be of good cheer... I am with thee  \nBe of good cheer... I am with thee  \nBe of good cheer... I am here, saith the Lord /:/\n\nI gave thee My salvation, by thy Name have I called  \nThou art My child  \nThrough the waters, through the fire also  \nI will deliver thee\n\n/:/ And I will not, I will not fear  \nI will not, I will not fear  \nThe Lord is with me /:/\n\nBe of good cheer"
  },
  "E53": {
    "title": "Without Holiness",
    "lyrics": "Without holiness no man shall see the Lord  \nWithout holiness no man shall see the Lord\n\n/:/ But I know that I shall see Him  \nBut I know that I shall see Him  \nAnd by His Spirit I shall be sanctified /:/"
  },
  "E54": {
    "title": "Hallelujah",
    "lyrics": "Hallelujah, hallelujah  \nHallelujah, hallelujah  \nHallelujah, hallelujah  \nHallelujah, hallelujah\n\nWe praise Thee, we praise Thee  \nWe praise Thee, we praise Thee  \nWe praise Thee, we praise Thee  \nWe praise Thee, we praise Thee\n\nChrist is coming, Christ is coming  \nChrist is coming, Christ is coming  \nChrist is coming, Christ is coming  \nChrist is coming, Christ is coming"
  },
  "E55": {
    "title": "Saturate Me, O Lord",
    "lyrics": "/:/ Saturate me, Lord, with Thy Spirit  \nSaturate me, Lord, with Thy Spirit  \nSaturate me, Lord, with Thy Spirit  \nSaturate me, Lord, with Thy Spirit\n\n/:/ And let me feel the fire of Thy love  \nHere in my heart, Oh! God  \nAnd let me feel the fire of Thy love  \nHere in my heart, Oh! God /:/"
  },
  "E56": {
    "title": "My Christ, My Rock",
    "lyrics": "My Christ, my Rock,  \nThere is none like unto Thee  \nForever I desire to praise  \nThe wonders of Thy love\n\nMy strength, my Shield,  \nAnd my Refuge art Thou  \nAll my being and all that I am  \nForever shall worship Thee\n\nLet all the earth praise the Lord  \nKings and kingdoms praise Him also  \nLet all the mountains bow down  \nAt the hearing of Jesus\n\nI sing with joy for Thy work in me  \nForever I praise Thee and will love Thee  \n/:/ I can do all things and strong shall I be in Thee /:/"
  },
  "E57": {
    "title": "Only in Christ",
    "lyrics": "Only in Christ  \nOnly in Him  \nSalvation is found in Him\n\nThere is no other Name  \nGiven among men  \nOnly in Christ  \nOnly in Him"
  },
  "E58": {
    "title": "Holy Spirit, I Am Calling Thee",
    "lyrics": "/:/ Holy Spirit, Holy Spirit,  \nHoly Spirit, I am calling Thee /:/\n\n/:/ For I desire to give Thee glory  \nIn this hour,  \nFor I desire to give Thee glory  \nTo Thee alone, O Lord /:/\nTo Thee alone, O Lord\n\n/:/ Here am I, here am I,  \nHere am I, Holy Spirit /:/"
  },
  "E59": {
    "title": "I Seek Thee",
    "lyrics": "/:/ I seek Thee, I seek Thee  \nWith fire in my heart  \nI seek Thee, I seek Thee  \nReceive my adoration /:/\n\n/:/ I long for Thee, I need Thee,  \nI love Thee more than my own being,  \nI long for Thee, I need Thee,  \nI love Thee more than my own being, Jesus /:/"
  },
  "E60": {
    "title": "Once While Working",
    "lyrics": "Once while working  \nI heard a voice  \nA voice that said:  \nSin no more\n\nJesus Christ is coming now  \nUpon a white cloud  \n/:/ Jesus Christ is coming now /:/  \nSin no more"
  },
  "E61": {
    "title": "I Long to Worship",
    "lyrics": "In Thy courts I stand, Lord Jesus,  \nI have come before Thee to offer  \nMy praise in gratitude;  \nThou art worthy, my Jesus,  \nTo receive the glory and the honour\n\nHere am I, Lord, before Thine altar,  \nToday I surrender before Thee  \nAll of my being;  \nWork now within me,  \nMake a new heart  \nGuided by Thy Spirit, Lord\n\nI come to offer, my Lord,  \nMy heart in adoration;  \nLet me enter into the Holy Place,  \nI desire to worship Thee;  \nI lay my being at Thy feet  \nAs a sweet-smelling savour  \n/:/ I desire to fill the Holy Place  \nWith my adoration /:/"
  },
  "E62": {
    "title": "There Is a Fountain in Me",
    "lyrics": "/:/ There is a fountain in me  \nThat is springing forth,  \nThat is flowing  \nWithin me /:/\n\n/:/ It is a river of praise  \nAnd of adoration,  \nDirected unto Thee, Lord Jesus, receive it /:/"
  },
  "E63": {
    "title": "In the Beginning",
    "lyrics": "/:/ In the beginning the Spirit of God  \nMoved upon the waters /:/\n\n/:/ But now He is moving  \nWithin my heart /:/"
  },
  "E64": {
    "title": "Let Thy Spirit Descend Here",
    "lyrics": "Let Thy Spirit descend here,  \nHear us, Lord, and fill us;  \nLet Thy Spirit descend here,  \nThy Spirit\n\nLet every nation bow before Thee,  \nProclaiming Thee, Holy God;  \nLet every nation bow before Thee,  \nBow before Thee\n\nGlory to Jesus,  \nTo the Lamb and King;  \nEver shalt Thou reign  \nWith power, with power, with power;  \nGlory to Jesus, Glory to Jesus, Glory to Jesus"
  },
  "E65": {
    "title": "If Joy Is Felt Here",
    "lyrics": "If joy is felt here  \nAt this sacred altar;  \nIf joy is felt here  \nWhere we are gathered\n\nIf joy is felt here,  \nWhat shall it be in Heaven  \nWhen I arrive with Christ?  \nFace to face I hope to see Him\n\nIn this gathering Christ is present;  \nHe hath promised to His flock:  \nWhere two or three  \nIn My Name are gathered,  \nI will be, I will be, I will be\n\nI feel Him here,  \nI feel Him in me;  \nHis Spirit maketh me sing\n\nI feel Him here,  \nI feel Him in me;  \nHis Spirit maketh me tremble"
  },
  "E66": {
    "title": "Faith Is Needed",
    "lyrics": "What do I need that I may be healed?  \nWhat dost thou need that the Lord may answer thee?,  \nPerchance a blessing?  \nMuch courage as well,  \nYet what is needed is Faith\n\nFaith is needed, faith is needed  \nTo draw near unto God;  \nThou must believe  \nTo draw near unto God,  \nThou hast need of Faith;  \nOnly through Faith,  \nToday thou canst be healed"
  },
  "E67": {
    "title": "When the People Praise",
    "lyrics": "/:/ When the people of the Lord  \nPraise God,  \nWondrous things come to pass /:/\n\n/:/ There is healing, deliverance,  \nAnd the presence of the Lord is felt /:/"
  },
  "E68": {
    "title": "Move in Me",
    "lyrics": "/:/ The Spirit of God is in this place,  \nThe Spirit of God is moving in this place;  \nAnd He is here to comfort,  \nAnd He is here to deliver,  \nAnd He is here to guide; the Spirit of God is here\n\n/:/ Move in me, move in me,  \nChange my mind, my heart,  \nFill my life with Thy love,  \nMove in me, Holy Spirit, move in me /:/"
  },
  "E69": {
    "title": "I Come to Express",
    "lyrics": "I come to express,  \nI come to adore,  \nAnd I have come to give  \nWhat is within my heart;  \nToday I would express  \nAll of my gratitude  \nFor what Thou hast done for me\n\nToday I would sing unto Him  \nWith joy of my soul  \nUnto my King and Lord,  \nUnto Jesus, the great King,  \nFor Thou art my Peace, O Lord;  \nThou art my Joy,  \nThou art my Adoration,  \nMy Longing art Thou"
  },
  "E70": {
    "title": "God Is Here",
    "lyrics": "/:/ God is here, as surely as the air that I breathe,  \nAs surely as the morning sun doth rise,  \nAs surely as when I speak to Him, He can hear me /:/\n\nThou canst feel Him at thy side this very moment,  \nThou canst bear Him deep within thy heart;  \nJesus is here, if thou wilt thou canst feel Him\n\nHoly! Holy! Holy!  \nMy heart adoreth Thee,  \nMy heart doth know to say:  \nHoly art Thou!"
  },
  "E71": {
    "title": "Praise Ye the LORD",
    "lyrics": "Praise the LORD, all ye nations,  \nAll ye people, praise Him;  \nFor He hath magnified  \nHis mercy toward us,  \n/:/ And the truth of the LORD  \nEndureth forever, Hallelujah, Amen /:/"
  },
  "E72": {
    "title": "I Will Praise",
    "lyrics": "////I will praise////, I will praise my Lord,  \n////I will praise////, I will praise my Lord,  \nJohn saw the number of the redeemed,  \nAnd all were praising the Lord. Some were praying, others singing,  \nYet all were praising the Lord  \n////I will praise////, I will praise my Lord  \nI will praise, I will praise, I will praise, I will praise, I will praise my Lord"
  },
  "E73": {
    "title": "Let Us Love from the Heart",
    "lyrics": "/:/ Let us love from the heart, not with lips only /:/  \n/:/ That when Christ shall come /:/ He may find us closely united  \n/:/ That when Christ shall come /:/ He may find us closely united.  \n\n/:/ How canst thou pray while angry with thy brother /:/  \n/:/ God doth not hear the prayer /:/ if thou art not reconciled.  \n/:/ God doth not hear the prayer /:/ if thou art not reconciled.  \n\n/:/ How many times ought I to forgive him that offendeth me /:/  \n/:/ Seventy times seven /:/ shalt thou forgive thy brother  \n/:/ Seventy times seven /:/ shalt thou forgive thy brother"
  },
  "E74": {
    "title": "Amen, Amen, Amen",
    "lyrics": "///Amen/// the promises of the Lord  \nAre ever Amen  \nWhen I read His Word I sing Amen  \nTo the command of the Lord I answer Amen."
  },
  "E75": {
    "title": "Amen, Let Our Voice Resound",
    "lyrics": "///Amen/// let our voice resound  \nAmen let the faithful say, and bless  \nThe name of God, ///Amen///  \nThe great blessing hath arrived  \nLet us praise with joy, and a shout  \nFrom the soul, let an Amen, Amen go forth."
  },
  "E76": {
    "title": "Sing unto the LORD",
    "lyrics": "///Sing unto the LORD a new song///  \n/:/ Sing unto the LORD /:/  \n///And what did God do? He wrought wonders///  \n/:/ Sing unto the LORD /:/  \n/:/ The sea opened wide, they passed on dry ground /:/  \n/:/ Sing unto the LORD /:/  \n//They saw Him descend, sent from heaven///  \n///Sing unto the LORD//  \n/:/ And what did God do? He wrought wonders /:/  \n/:/ Sing unto the LORD /:/"
  },
  "E77": {
    "title": "As Jeremiah Prayed and Wept",
    "lyrics": "/:/ As Jeremiah prayed and wept,  \nEven so would I pray and weep /:/  \n\n/:/ And God answered him the petition that he made;  \nEven so would I have Him answer mine /:/"
  },
  "E78": {
    "title": "As the Sheep",
    "lyrics": "/:/ As the sheep have need of the Shepherd,  \nWe need Thee /:/  \nWe need Thee, come, good Jesus  \nWe need Thee, we need Thee  \nCome, good Jesus, we need Thee."
  },
  "E79": {
    "title": "With Christ in My Soul",
    "lyrics": "With Christ in my soul all ///goeth happily///  \nWith Christ in my soul all goeth happily  \nAnd time shall pass away  \nI shall not fear, I shall not fear  \nWith Christ in my soul all goeth happily  \nAnd time shall pass away"
  },
  "E80": {
    "title": "Jesus Loves Me, This I Know",
    "lyrics": "Jesus loves me, this I know  \nFor His Word doth tell me so  \nAnd I ever shall believe, for 'tis a faithful promise  \nJesus loves me, Jesus loves me,  \nJesus loves me, the Bible tells me so."
  },
  "E81": {
    "title": "Christ Breaks the Chains",
    "lyrics": "///Christ breaketh the chains///  \nAnd giveth us security.  \nHow is it possible that I should live without Jesus  \nWhen the foundation of my life art Thou.  \nThou didst deliver me from sin and from death  \nHow is it possible that I should live without Jesus  \n\nFree /:/ Thou hast made me free /:/ free, Lord  \nBroken were the chains that were binding my heart  \nFree /:/ Thou hast made me free /:/ free, Lord  \nBroken were the chains that were binding my heart"
  },
  "E82": {
    "title": "Let Us Give Thanks unto the Lord",
    "lyrics": "///Let us give thanks unto the Lord/// for His love  \n///Let us give thanks unto the Lord/// for His love  \nIn the morning, the birds sing the praises  \nUnto Christ the Saviour; and thou, brother, why dost thou not sing,  \nThe praises unto Christ the Saviour?"
  },
  "E83": {
    "title": "God Is Our Refuge",
    "lyrics": "God is our refuge, our strength,  \nOur very present help in trouble;  \nThough the mountains be carried into the sea,  \n/:/ Though the earth should tremble, we must sing /:/"
  },
  "E84": {
    "title": "Where the Spirit of God Is",
    "lyrics": "Where the Spirit of God is, there is /:/ liberty /:/  \nWhere the Spirit of God is, there is /:/ liberty /:/  \nThere is always /:/ liberty /:/  \nWhere the Spirit of God is, there is always liberty.  \n/:/ Saturate me, Lord, with Thy Spirit /:/ and let me  \n\nFeel the fire of Thy love here in my heart,  \nO God; /:/ and let me feel the fire of Thy love  \nHere in my heart, O God"
  },
  "E85": {
    "title": "The Love of God Is Wonderful",
    "lyrics": "///The love of God is wonderful///  \nGreat is the love of God.  \n\n/:/ So high that I cannot be above it,  \nSo deep that I cannot be beneath it,  \n\nSo vast that I cannot be outside of it. /:/  \nGreat is the love of God"
  },
  "E86": {
    "title": "Whosoever Desires to Taste the Power",
    "lyrics": "He who desires to taste the power of love,  \nThe power of the love of God,  \n/:/ Let him draw near to the altar  \nAnd surrender to Jesus, and he shall have the love of God /:/"
  },
  "E87": {
    "title": "In My Heart There Are Banners of Love",
    "lyrics": "In my heart there are  \n///Banners of love///  \nIn my heart there are  \n///Banners of love///  \nFor Christ now liveth in me;  \nLift them up higher, ///that all may see,///  \nLift them up higher, that all may see that  \nChrist now liveth in me"
  },
  "E88": {
    "title": "In Moments Like These",
    "lyrics": "In moments like these, I lift up my voice,  \nI lift up my song unto Christ,  \nIn moments like these I lift up my being,  \nI lift up my soul unto Him;  \n///How I love Thee, O God,/// I love Thee"
  },
  "E89": {
    "title": "Is Thy Lamp Burning?",
    "lyrics": "Is thy lamp burning?  \nDost thou feel thy heart burning?  \nDost thou feel that thou hast new life,  \nGoest thou singing toward Zion?  \nIs thy lamp extinguished?  \nAnd if thou longest to have light,  \nPour in the oil, it costeth naught;  \nGood Jesus freely gives it to thee"
  },
  "E90": {
    "title": "This Is the Christ",
    "lyrics": "/:/ This is the Christ whom I preach,  \nAnd I weary not of preaching;  \nHe healeth the sick, He rebuketh demons,  \nAnd calmeth the tempest. /:/  \n\n///And I will praise Him,///  \nSaying, Glory to God!  \n///And I will praise Him,///  \nSaying, Glory to God."
  },
  "E91": {
    "title": "This Joy That I Feel",
    "lyrics": "This joy that I feel in my soul,  \nOnly Christ could give it to me;  \nThis joy that I feel in my soul,  \n/// Only Christ could give it to me ///  \nThis joy that I feel in my soul,  \nOnly Christ could give it to me.  \n\n/:/ Oh, what happiness /:/  \nAll singing in chorus to our Heavenly Father;  \nOh, what happiness, oh, what happiness,  \nAll singing in chorus  \nUnto our Heavenly Father.  \n\n/// The Lord filled me with joy,  \nHe put peace in my heart ///  \nHe put peace in my heart  \n\n/:/ Oh, what happiness /:/  \nAll singing in chorus  \nUnto our Heavenly Father;  \n/:/ Oh, what happiness /:/  \nAll singing in chorus  \nUnto our Heavenly Father"
  },
  "E92": {
    "title": "I Am Trusting, Lord, in Thee",
    "lyrics": "I am trusting, Lord, in Thee;  \nI am trusting, Lord, in Thee.  \nThou art faithful, Lord, very faithful to me;  \nThou hast never left me, though I am weak;  \nI am trusting, Lord, in Thee."
  },
  "E93": {
    "title": "Glory to the Lamb",
    "lyrics": "Glory to the Lamb who shed His blood  \nTo deliver us from condemnation;  \n/:/ Now, O grave, where is thy victory?  \nNow, O death, where is thy sting? /:/"
  },
  "E94": {
    "title": "There Is Power",
    "lyrics": "There is /:/ power /:/ matchless power  \nIn Jesus, who died (and rose again);  \nThere is /:/ power /:/ matchless power  \nIn the blood that He shed.  \n\nWouldst thou be saved from all iniquity?  \nThere is only power in my Jesus;  \nWouldst thou overcome every cruel temptation?  \nThere is only power in Jesus.  \n\nThere is /:/ power /:/ matchless power  \nIn Jesus, who died (and rose again);  \nThere is /:/ power /:/ matchless power  \nIn the blood that He shed"
  },
  "E95": {
    "title": "The Lord Is in His Temple",
    "lyrics": "/:/ The Lord is in His temple. Let him that liveth praise Him /:/  \n/// Praise Him ///, for He liveth;  \n/// Praise Him ///, for He liveth"
  },
  "E96": {
    "title": "Jesus, I Love Thee",
    "lyrics": "Jesus, I love Thee  \nJesus, I love Thee  \nJesus, I love Thee  \nBecause Thou hast loved me  \nBecause Thou hast saved me  \nJesus, I love Thee"
  },
  "E97": {
    "title": "The Glory of the Lord",
    "lyrics": "/:/ The glory of the Lord  \nFell upon Sinai,  \nAnd that mountain trembled  \nBecause God was there /:/  \n/:/ God was there /:/  \nAnd that mountain trembled  \nBecause God was there.  \n\n/:/ Let it descend today /:/  \nThat glory upon me;  \n/// I long for the power ///  \nPentecostal power."
  },
  "E98": {
    "title": "Lift Up the Banner",
    "lyrics": "Lift up the banner, ye children of the Lord;  \nLift up the banner, ye children of the Lord;  \nWhen Christ shall come,  \nAll will be singing, we shall all sing  \nGlory to the Lord; when Christ shall come,  \nAll will be singing, we shall all sing glory to the Lord"
  },
  "E99": {
    "title": "March On, O Youth",
    "lyrics": "March on, O youth of Jesus Christ,  \nNever lose the vision;  \nFight against Satan,  \nThat is the Christian's motto  \nIn prayer;  \nTrust in the Lord,  \nWith every triumph I shall sing  \nA new song;  \nMarch on, O youth,  \nIn pursuit of the prize!  \nForward let us go, O youth,  \nForward unto perfection;  \nForward let us go, O youth,  \nAnd a crown Jesus Christ shall give unto us;  \n/// If we triumph here, there I shall have ///"
  },
  "E100": {
    "title": "Behold the Souls, How They Walk",
    "lyrics": "Behold the souls, how they walk,  \nSeeking for joy,  \nSeeking for peace;  \nYet they seek not Jesus Christ,  \nHe who hath it, He who giveth it;  \nYet they seek not Jesus Christ,  \nHe who hath it, He who giveth it"
  },
  "E101": {
    "title": "Not with Sword",
    "lyrics": "/:/ Not with sword, nor with army,  \nBut by Thy Holy Spirit /:/  \n/// And this Church shall be moved ////  \nBy Thy Holy Spirit  \n\n/// Yonder in Heaven /// there will be no more weeping,  \nNeither more sorrow, nor any more pain;  \nAnd when we, the redeemed, are there,  \nYonder in Heaven we shall praise the Lord."
  },
  "E102": {
    "title": "There Is No God as Great as Thou",
    "lyrics": "There is no God as great as Thou,  \nThere is none, there is none;  \nThere is no God as great as Thou,  \nThere is none, there is none;  \nThere is none other that can do the works, like unto those Thou doest;  \nThere is none other that can do the works like unto those Thou doest"
  },
  "E103": {
    "title": "O Heavenly Fire",
    "lyrics": "O Heavenly Fire, come and fill  \nMy heart with Thy power;  \nDescend once again  \nWith Thy Pentecostal power,  \nFill my being;  \nBaptize me, Lord, with that heavenly fire  \nWhich giveth power;  \nO come, Lord Jesus, to baptize me  \nWith Thy Pentecostal power."
  },
  "E104": {
    "title": "O What a Precious Gift",
    "lyrics": "O what a precious gift,  \nChrist gave unto me;  \nHe filled my soul with joy and saved me,  \nNow I can sing unto Him with a loud voice:  \nO what a precious gift  \nChrist gave unto me."
  },
  "E105": {
    "title": "Put Oil in My Lamp, Lord",
    "lyrics": "Put oil in my lamp, Lord  \nPut oil in my lamp, Lord  \nThat I may serve Thee with love  \nPut oil in my lamp, Lord  \nHe came to bring liberty  \nHe came to save  \nThis world that is found  \nIn sin  \nAnd to give us a spiritual life."
  },
  "E106": {
    "title": "Prepare Thyself That Thou Mayest Feel",
    "lyrics": "/// Prepare thyself that thou mayest feel ///  \n/// And let Him move ///  \nWithin thy heart  \n\n/// The fire falls, falls, the evils depart, depart,  \nAnd believers praise Jesus ///"
  },
  "E107": {
    "title": "Soon the Lord Shall Come",
    "lyrics": "Soon the Lord shall come  \nHis glorious people to lift up,  \nThe people whom He purchased  \nAt the price of precious blood.  \n\nThe angels shall come,  \nAnd there His people shall gather;  \nThere I desire to be,  \nTo listen to His voice  \nWhen He shall say to me: \"Come, faithful servant\";  \nThere I desire to be,  \nTo hear His voice  \nWhen He shall say to me: \"Come, faithful servant\""
  },
  "E108": {
    "title": "Abide, O Lord",
    "lyrics": "/// Abide, O Lord, /// in every heart  \n/// Abide /// in me  \nO my Christ, make of my soul an altar  \nTo sing unto Thee with devotion;  \nO my Christ, make of my soul an altar  \nTo sing unto Thee with all my heart."
  },
  "E109": {
    "title": "How Good It Is",
    "lyrics": "How good it is, how good it is, to sing to the Lord  \nHow good it is, how good it is, to sing to the Lord  \nO brother, let us sing unto Him,  \nHow good it is, how good it is  \nTo sing unto the Lord."
  },
  "E110": {
    "title": "How Glorious It Is to Walk with Christ",
    "lyrics": "How glorious it is to walk with God,  \nHow glorious it is to walk with God;  \nHe shall guide my footsteps,  \nHow glorious it is to walk with God."
  },
  "E111": {
    "title": "Let the Power Be Felt",
    "lyrics": "Let the power of the Lord be felt  \nIn thy speaking, brother;  \nLet the power be felt,  \nI desire to rejoice in thy speaking.  \nSpeak with faith and courage, and have no fear;  \nLet the power of God be felt in thy speaking;  \n/// Let the power be felt /// of God in thee,  \n/// Let the power be felt /// of God."
  },
  "E112": {
    "title": "Take Away the Stone",
    "lyrics": "Take away the stone, let the water flow,  \nBehold, the souls are perishing;  \nSpeak to them of Christ, that is thy duty:  \n/:/ If the water is stagnant it cannot flow /:/"
  },
  "E113": {
    "title": "Take Away the Stone from Thy Heart",
    "lyrics": "Take away the stone from thy heart,  \nAnd thou shalt have life in the Lord Jesus;  \nEven as they took away the stone that covered  \nLazarus in his tomb, that unto life he came forth;  \nEven as they took away the stone that covered  \nLazarus in his tomb, that unto life came forth"
  },
  "E114": {
    "title": "If Anyone Asks Thee How Thou Art",
    "lyrics": "If anyone ask thee /// \"How art thou?\" ///  \nIf anyone ask thee /// \"How art thou?\" ///  \nBlessed, greatly /:/ blessed /:/ because Christ liveth in me  \nBlessed, greatly /:/ blessed /:/ because Christ liveth in me.  \n\nThis work /:/ shall not stop /:/  \nThis work /:/ shall not stop /:/  \nThis work shall not stop  \nBecause it is within my heart  \n\nThe fire /:/ falls /:/, the evils /:/ depart /:/  \nAnd the believers praise the Lord  \nThe fire /:/ falls /:/, the evils /:/ depart /:/  \nAnd the believers praise the Lord"
  },
  "E115": {
    "title": "I Am Happy, Christ Saved Me",
    "lyrics": "/// I am happy, Christ saved me ///  \nO glory hallelujah,  \nChrist saved me  \n/// I am happy, He lifted me ///  \nO glory hallelujah, He lifted me  \n/// I am happy, I feel Him in me ///  \nO glory hallelujah,  \nI feel Him in me."
  },
  "E116": {
    "title": "All the Good That I Have",
    "lyrics": "All the good that I have  \nI have received from God;  \nHe hath given me all in His grace,  \nHe hath given me all in His love.  \n\nTherefore with all my soul  \nI desire to praise Thee, Lord.  \nWhen I knew Thee, I received from Thee  \nThe most glorious blessing;  \nI received from God the great salvation,  \nTherefore am I happy with Him."
  },
  "E117": {
    "title": "I Can Do All Things Through Christ",
    "lyrics": "I can do all things through Christ which strengtheneth me  \n/:/ Philippians 4:13 /:/  \nI can do all things through Christ which strengtheneth me  \n/:/ Philippians 4:13, hallelujah, glory to God."
  },
  "E118": {
    "title": "Take, Lord, I Pray, My Hand",
    "lyrics": "Take, Lord, I pray, my hand, with Thee I desire to go;  \nWith blood here Thou didst pay for me,  \nToday I would serve Thee;  \nI long to be able to overcome evil,  \nAnd in holiness live;  \nTake, Lord, I pray, my hand, with Thee I desire to go;  \nNone shall be able to hinder my path,  \nNone shall be able to obstruct my life;  \nThou art the Way, the Truth, and the Life;  \nTake my hand, Lord, and I shall overcome."
  },
  "E119": {
    "title": "A Look of Faith",
    "lyrics": "/:/ A look of faith, a look of faith  \nIs that which can save the sinner /:/  \nAnd if thou comest unto Christ Jesus,  \nHe will forgive thee;  \nFor a look of faith,  \nIs that which can save the sinner."
  },
  "E120": {
    "title": "A Miracle God Desires to Work in Thee",
    "lyrics": "/:/ A miracle God desires to work in thee /:/  \nHe wants to save thee, He wants to heal thee,  \nHe wants to help thee and make thee faithful;  \nA miracle God desires to work in thee,  \nA miracle God desires to work in thee;  \nOnly believe in Jesus Christ,  \nAnd the miracle shall come to pass."
  },
  "E121": {
    "title": "It Is Descending Now",
    "lyrics": "It is descending now, it is descending now,  \nThe glory of Jehovah is descending;  \nIf His people begin to pray,  \nThe Lord will answer:  \nThe glory of Jehovah is descending."
  },
  "E122": {
    "title": "Let Us Pray On",
    "lyrics": "/:/ Let us pray on until the power of God cometh down /:/"
  },
  "E123": {
    "title": "There Is No Fear in My Soul",
    "lyrics": "There are no fears now in my being  \nIf my Jesus is with me;  \nThere are no sorrows as of yesterday  \nIf my Jesus is with me:  \nWhy should I be sorrowful?"
  },
  "E124": {
    "title": "I Feel Joy in My Soul",
    "lyrics": "I feel joy in my soul  \nJoy in my soul, joy in my soul and in my being  \nIt is like rivers of living water  \nRivers of living water, rivers of living water in my being  \nI am happy, I am happy  \nBecause Christ saved me, and now I gladly sing  \nBecause Christ redeemed my soul  \nTurn back, I will turn back no more  \nBecause the world can give me nothing  \nI am happy, I am happy  \nBecause Christ saved me."
  }
};

const localizedHymnCache = new WeakMap<
  object,
  { title: string; lyrics: string; value: LocalizableHymn }
>();

/**
 * Returns a localized hymn object for display/search without mutating the source entry.
 * Uses a WeakMap identity cache so repeated calls return a stable object reference
 * for 120Hz FlatList / Reanimated rendering on iOS and Android.
 * Falls back cleanly to Spanish when hymnLanguage === 'es' or an English translation
 * is missing or blank.
 */
export function getLocalizedHymn<T extends LocalizableHymn>(
  hymn: T,
  hymnLanguage: Language,
): T {
  if (!hymn || hymnLanguage !== 'en') return hymn;
  const translation = ALABANZAS_ENGLISH[String(hymn.id)];
  if (!translation) return hymn;
  const nextTitle = translation.title || hymn.title;
  const nextLyrics = translation.lyrics || hymn.lyrics;
  if (nextTitle === hymn.title && nextLyrics === hymn.lyrics) return hymn;

  const cached = localizedHymnCache.get(hymn);
  if (cached && cached.title === nextTitle && cached.lyrics === nextLyrics) {
    return cached.value as T;
  }

  const localized: T = {
    ...hymn,
    title: nextTitle,
    lyrics: nextLyrics,
  };
  localizedHymnCache.set(hymn, { title: nextTitle, lyrics: nextLyrics, value: localized });
  return localized;
}

/**
 * Maps an array of hymns or estribillos to the selected hymn language.
 */
export function getLocalizedHymns<T extends LocalizableHymn>(
  hymns: readonly T[],
  hymnLanguage: Language,
): T[] {
  if (hymnLanguage !== 'en') return hymns as T[];
  return hymns.map((hymn) => getLocalizedHymn(hymn, hymnLanguage));
}
