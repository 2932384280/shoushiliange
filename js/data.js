// data.js - 完整版（新增男主剧情事件、支线任务、收藏品、节日故事、NPC互动文本、约会内容）
export const themes = {
    sakura: { name: '樱花粉', primary: '#ff69b4', secondary: '#ff85c0', bg: '#ffe4f1', button: '#ff91b5', border: '#ffb6d1' },
    peach: { name: '蜜桃粉', primary: '#ff8da1', secondary: '#ffb3c1', bg: '#ffe0e6', button: '#ff8da1', border: '#ffb3c1' },
    rose: { name: '玫瑰粉', primary: '#e84393', secondary: '#fd79a8', bg: '#fce4ec', button: '#e84393', border: '#fd79a8' },
    lavender: { name: '粉紫', primary: '#a855f7', secondary: '#c084fc', bg: '#f3e8ff', button: '#a855f7', border: '#c084fc' }
};

export const avatarList = [
    { emoji: '⭐', desc: '星之少女' },
    { emoji: '🌙', desc: '月之巫女' },
    { emoji: '☀️', desc: '太阳女神' }
];

// ========== 兽历节日（新增 story 字段） ==========
export const TRIBAL_EVENTS = [
    { id: 'beast_god_birth', name: '🐾 兽神诞日', month: 1, day: 1, locations: ['部落广场', '萨满祭坛'], desc: '兽人们聚在一起庆祝兽神的诞辰。', effects: { placeBoosts: { '部落广场': { actions: ['🎉 参加庆典'], rewards: '亲和+3，魅力+2' } } }, preheatDays: 2,
      story: '今天是兽神诞日，整个部落都沉浸在庆典的气氛中。你看到烈阳在广场上兴奋地跑来跑去，苍夜则安静地站在祭坛旁，目光深邃……' },
    { id: 'beast_god_ritual', name: '🔮 祭祀之礼', month: 1, day: 2, locations: ['萨满祭坛'], desc: '萨满长老主持祭祀之礼。', effects: { placeBoosts: { '萨满祭坛': { actions: ['🙏 参与祭祀'], rewards: '直觉+3，体质+2' } } }, preheatDays: 0 },
    { id: 'spring_market', name: '🌸 春市集', month: 1, day: 15, locations: ['市场'], desc: '春季第一次大市集。', effects: { placeBoosts: { '市场': { actions: ['🛍️ 逛春市'], rewards: '获得稀有种子或小饰品' } } }, preheatDays: 1 },
    { id: 'spring_equinox', name: '🌱 春分祭', month: 3, day: 20, locations: ['部落广场'], desc: '春分时节，祭拜大地。', effects: { placeBoosts: { '部落广场': { actions: ['🌾 参与春耕祭'], rewards: '才艺+2，亲和+1' } } }, preheatDays: 2 },
    { id: 'summer_solstice', name: '☀️ 夏至庆典', month: 6, day: 21, locations: ['部落广场', '训练场'], desc: '一年中最长的白天。', effects: { placeBoosts: { '训练场': { actions: ['🏋️ 参加力量赛'], rewards: '体质+3，魅力+1' } } }, preheatDays: 2 },
    { id: 'fire_protection', name: '🔥 防火祭', month: 5, day: 10, locations: ['萨满祭坛'], desc: '祭祀祈求火神庇护。', effects: { placeBoosts: { '萨满祭坛': { actions: ['🔥 祈火仪式'], rewards: '获得火灵护符' } } }, preheatDays: 1 },
    { id: 'summer_market', name: '🌺 夏市集', month: 5, day: 15, locations: ['市场'], desc: '夏季市集。', effects: { placeBoosts: { '市场': { actions: ['🍉 购买夏季特产'], rewards: '获得清凉果或草帽' } } }, preheatDays: 1 },
    { id: 'drought_prayer', name: '🌧️ 祈雨祭', month: 6, day: 5, locations: ['萨满祭坛'], desc: '祈雨仪式。', effects: { placeBoosts: { '萨满祭坛': { actions: ['💧 祈雨'], rewards: '直觉+2，亲和+1' } } }, preheatDays: 0 },
    { id: 'hunt_festival', name: '🏹 狩猎节', month: 7, day: 1, locations: ['部落广场', '训练场'], desc: '狩猎季开始，向兽神祈福。', effects: { placeBoosts: { '部落广场': { actions: ['🔮 祈福'], rewards: '获得猎运符' } } }, preheatDays: 2 },
    { id: 'hunt_depart', name: '🌿 狩猎出征', month: 7, day: 5, locations: ['训练场'], desc: '猎人们整装待发。', effects: { placeBoosts: { '训练场': { actions: ['🚩 送行'], rewards: '亲和+1' } } }, preheatDays: 0 },
    { id: 'rain_ritual', name: '🌧️ 雨祭', month: 8, day: 15, locations: ['河边'], desc: '连续暴雨，举行仪式。', effects: { placeBoosts: { '河边': { actions: ['🌀 安抚雨神'], rewards: '直觉+2，才艺+1' } } }, preheatDays: 0 },
    { id: 'hunt_return', name: '🎊 猎归宴', month: 9, day: 20, locations: ['部落广场'], desc: '猎人带着猎物归来。', effects: { placeBoosts: { '部落广场': { actions: ['🍗 参加宴席'], rewards: '生命+10，亲和+2' } } }, preheatDays: 1 },
    { id: 'winter_prep', name: '❄️ 入冬准备', month: 10, day: 25, locations: ['铁匠铺', '市场'], desc: '收集木材、制作冬衣。', effects: { placeBoosts: { '铁匠铺': { actions: ['🪓 打造冬具'], rewards: '获得防寒护具' } } }, preheatDays: 2 },
    { id: 'winter_solstice', name: '❄️ 冬至祭', month: 12, day: 22, locations: ['萨满祭坛'], desc: '一年中夜晚最长的一天。', effects: { placeBoosts: { '萨满祭坛': { actions: ['🕯️ 祭祖'], rewards: '直觉+3，体质+1' } } }, preheatDays: 2 },
    { id: 'new_year_eve', name: '🎆 兽历除夕', month: 12, day: 30, locations: ['部落广场'], desc: '部落点燃篝火，告别旧岁。', effects: { placeBoosts: { '部落广场': { actions: ['🔥 守岁'], rewards: '全属性+1' } } }, preheatDays: 2,
      story: '兽历除夕夜，篝火映红了每个人的脸。你看到流云独自站在哨塔顶端望向远方，而岩岳默默地往火堆里添了一根又一根木柴……' },
    { id: 'winter_market', name: '🧣 冬市集', month: 11, day: 15, locations: ['市场'], desc: '冬季市集。', effects: { placeBoosts: { '市场': { actions: ['🧤 购买冬货'], rewards: '获得毛皮手套或围巾' } } }, preheatDays: 1 },
    { id: 'snow_festival', name: '⛄ 雪祭', month: 12, day: 10, locations: ['部落广场'], desc: '第一场雪后，欢庆雪季。', effects: { placeBoosts: { '部落广场': { actions: ['⛄ 玩雪'], rewards: '魅力+2，亲和+1' } } }, preheatDays: 0 }
];

// ========== 姓名库、种族库、性格库、外貌库 ==========
export const FIRST_NAMES_MALE = ['阿','巴','查','达','额','法','嘎','哈','基','卡','拉','马','纳','帕','恰','萨','塔','瓦','雅','扎'];
export const FIRST_NAMES_FEMALE = ['艾','贝','采','黛','娥','菲','歌','荷','姬','可','莉','美','娜','欧','佩','茜','若','莎','薇','雪'];
export const LAST_NAMES = ['风','云','雷','电','霜','雪','月','星','阳','影','林','森','山','河','海','湖','焰','羽','鳞','爪'];

export const RACES = ['狼族','虎族','狐族','熊族','鹰族','蛇族','鹿族','兔族','豹族','狮族'];
export const RACES_EMOJI = {'狼族':'🐺','虎族':'🐯','狐族':'🦊','熊族':'🐻','鹰族':'🦅','蛇族':'🐍','鹿族':'🦌','兔族':'🐰','豹族':'🐆','狮族':'🦁'};

export const PERSONALITIES = ['温和友善','热情开朗','沉默寡言','聪慧机敏','憨厚老实','高傲自信','温柔体贴','活泼好动','沉稳冷静','神秘莫测'];
export const APPEARANCES_MALE = ['身材高大，眼神锐利','肌肉结实，行动敏捷','面容英俊，气质不凡','文质彬彬，举止优雅','憨厚可掬，笑容温暖','孤傲冷峻，目光深邃'];
export const APPEARANCES_FEMALE = ['身材苗条，长发飘逸','面容清秀，眼眸明亮','气质温婉，举止端庄','活泼俏皮，笑容甜美','冷艳高贵，气质出众','温柔可人，亲和力强'];

export const IDENTITIES = ['猎人','铁匠','医者','商人','农夫','渔夫','伐木工','工匠','药师','歌者','舞者','教师','厨师','园丁','守卫','哨兵','学徒','学者','长老'];

export const IDENTITY_AGE_REQUIREMENTS = {
    '学徒': { minAge: 10, maxAge: 25 },
    '学者': { minAge: 20, maxAge: 80 },
    '长老': { minAge: 50, maxAge: 150 },
    '教师': { minAge: 30, maxAge: 80 },
    '医者': { minAge: 30, maxAge: 100 },
    '药师': { minAge: 25, maxAge: 90 },
    '工匠': { minAge: 30, maxAge: 80 },
    '铁匠': { minAge: 30, maxAge: 70 },
    '猎人': { minAge: 25, maxAge: 60 },
    '守卫': { minAge: 20, maxAge: 50 },
    '哨兵': { minAge: 20, maxAge: 45 },
    '商人': { minAge: 25, maxAge: 70 },
    '农夫': { minAge: 20, maxAge: 65 },
    '渔夫': { minAge: 20, maxAge: 65 },
    '伐木工': { minAge: 20, maxAge: 60 },
    '歌者': { minAge: 18, maxAge: 50 },
    '舞者': { minAge: 18, maxAge: 40 },
    '厨师': { minAge: 20, maxAge: 60 },
    '园丁': { minAge: 18, maxAge: 60 },
};

export const RELATION_TYPES = [
    { type: '父亲', emoji: '👨', weight: 10 },
    { type: '母亲', emoji: '👩', weight: 10 },
    { type: '哥哥', emoji: '👦', weight: 8 },
    { type: '姐姐', emoji: '👧', weight: 8 },
    { type: '弟弟', emoji: '🧑', weight: 6 },
    { type: '妹妹', emoji: '👧', weight: 6 },
    { type: '叔叔', emoji: '🧔', weight: 5 },
    { type: '姑姑', emoji: '👩', weight: 5 },
    { type: '伯父', emoji: '👨', weight: 5 },
    { type: '伯母', emoji: '👩', weight: 5 },
    { type: '挚友', emoji: '🤝', weight: 8 },
    { type: '恩师', emoji: '📚', weight: 4 },
    { type: '青梅竹马', emoji: '🌸', weight: 6 }
];

export const ELDER_DATA = {
    id: 'elder',
    name: '大长老',
    emoji: '🐺',
    gender: '男',
    race: '狼族',
    age: 70,
    birthMonth: 1,
    birthDay: 1,
    personality: '睿智慈祥，博学多识。他是兽世部落的灵魂人物，知晓许多古老的传说和知识。',
    appearance: '灰白狼耳，银白长须，手持木杖，眼神深邃而慈祥，穿着朴素的兽皮长袍。',
    identity: '部落大长老',
    favorability: 30
};

export const GUY_RELATIONSHIPS = {};

// ========== ★ 男主专属随机剧情事件（扩充） ==========
export const GUY_STORY_EVENTS = {
    cangye: [
        { id: 'cangye_story_1', minAffection: 20, title: '🐺 月下独白', locations: ['月崖', '部落广场'],
          content: '你在月崖遇到了独自望月的苍夜。他听到脚步声没有回头，只是低声说："今晚的月亮，和第一次见到你时一样圆。"你发现他手中握着一枚刻着你名字的狼牙吊坠……',
          gain: 4, obsessionGain: 2 },
        { id: 'cangye_story_2', minAffection: 40, title: '🐺 狼群的低语', locations: ['月崖', '苍夜之窟'],
          content: '苍夜带你来到了狼群的领地。几只幼狼好奇地围着你转，他站在一旁，眼中带着罕见的温柔："它们很喜欢你。狼群从不轻易接受外人。"',
          gain: 5, obsessionGain: 3 },
        { id: 'cangye_story_3', minAffection: 60, title: '🐺 旧伤往事', locations: ['苍夜之窟', '月崖'],
          content: '你注意到苍夜左眼那道细疤。他沉默片刻，缓缓开口："这是十年前，为保护狼群留下的。从那时起，我就不再相信任何人……直到遇见你。"',
          gain: 6, obsessionGain: 4 },
        { id: 'cangye_story_4', minAffection: 80, title: '🐺 霜月之誓', locations: ['月崖'],
          content: '满月之夜，苍夜单膝跪地，将一枚冰蓝色的狼牙戒指递到你面前："霜月狼族的传统——用守护者的狼牙定情。你愿意……成为我的月亮吗？"',
          gain: 8, obsessionGain: 5 },
        { id: 'cangye_story_5', minAffection: 50, title: '🐺 雪夜取暖', locations: ['苍夜之窟', '月崖'],
          content: '大雪纷飞的夜晚，苍夜用他宽大的狼尾将你裹紧，化作巨狼为你挡风。"别怕，有我在。"他的声音低沉而温暖。',
          gain: 5, obsessionGain: 3 },
    ],
    lieyang: [
        { id: 'lieyang_story_1', minAffection: 20, title: '🐯 虎族的早餐', locations: ['训练场', '烈阳木屋'],
          content: '烈阳一大早就跑到你家门口，手里捧着一大块烤得香喷喷的鹿肉。"我特意早起烤的！你尝尝！"他虎尾期待地摇晃着，眼里闪着光。',
          gain: 4, obsessionGain: 2 },
        { id: 'lieyang_story_2', minAffection: 40, title: '🐯 烈阳的弱点', locations: ['训练场'],
          content: '训练时，烈阳不小心扭伤了脚踝。你发现他其实怕疼得要命，却硬撑着说"没事"。你帮他包扎时，他的耳朵红得像要滴血。',
          gain: 5, obsessionGain: 3 },
        { id: 'lieyang_story_3', minAffection: 60, title: '🐯 狩猎的秘密', locations: ['烈阳木屋', '部落广场'],
          content: '烈阳悄悄告诉你，他每次狩猎前都会去祭坛求一根护身符。"我以前从不信这些，但自从认识你之后，我开始害怕受伤了。"',
          gain: 6, obsessionGain: 4 },
        { id: 'lieyang_story_4', minAffection: 80, title: '🐯 赤金之心', locations: ['训练场', '月崖'],
          content: '烈阳递给你一枚用虎牙打磨的吊坠："这是我换牙时掉的第一颗虎牙，一直留着。送给你——从今以后，你就是我烈阳最重要的人。"',
          gain: 8, obsessionGain: 5 },
        { id: 'lieyang_story_5', minAffection: 50, title: '🐯 雨中的守护', locations: ['训练场', '河边'],
          content: '突然下起大雨，烈阳用他宽大的虎尾为你遮雨，自己却被淋湿。"别感冒了，我皮厚。"他咧嘴笑道。',
          gain: 5, obsessionGain: 2 },
    ],
    xuanyu: [
        { id: 'xuanyu_story_1', minAffection: 20, title: '🦊 幻香之惑', locations: ['密林小径', '玄羽幻香居'],
          content: '玄羽在密林中采药，九条尾巴轻轻摆动。他回头看你一眼，狐狸眼微弯："你身上有我的药草香了——这是标记。"',
          gain: 4, obsessionGain: 2 },
        { id: 'xuanyu_story_2', minAffection: 40, title: '🦊 两百年孤独', locations: ['玄羽幻香居', '河边'],
          content: '玄羽难得沉默，他看着河水缓缓道："我活了太久，见过太多离别。你是我第一次……害怕失去的人。"',
          gain: 5, obsessionGain: 3 },
        { id: 'xuanyu_story_3', minAffection: 60, title: '🦊 幻术之秘', locations: ['密林小径'],
          content: '玄羽教你一招简单的幻术——让枯叶变作蝴蝶。当蝴蝶在你掌心飞舞时，他轻声说："这是我唯一愿意分享的秘密。"',
          gain: 6, obsessionGain: 4 },
        { id: 'xuanyu_story_4', minAffection: 80, title: '🦊 永夜之花', locations: ['玄羽幻香居'],
          content: '玄羽将一朵永不凋谢的幽蓝花别在你发间："这是我用百年修为凝结的永夜花。花开之时，便是我心许之日。"',
          gain: 8, obsessionGain: 5 },
        { id: 'xuanyu_story_5', minAffection: 50, title: '🦊 月下药茶', locations: ['密林小径', '河边'],
          content: '玄羽在月下为你煮了一壶安神药茶，九尾在身后轻轻摆动。"喝完这杯，今晚能睡个好觉。"他眼中泛起温柔的光。',
          gain: 5, obsessionGain: 3 },
    ],
    yanyue: [
        { id: 'yanyue_story_1', minAffection: 20, title: '🐻 熊掌的温度', locations: ['铁匠铺', '岩岳石洞'],
          content: '岩岳笨拙地递给你一个暖手炉："天冷了，我……我打的。你手总是凉的。"他的熊耳微微抖动着，耳尖泛红。',
          gain: 4, obsessionGain: 2 },
        { id: 'yanyue_story_2', minAffection: 40, title: '🐻 蜂蜜的秘密', locations: ['岩岳石洞', '市场'],
          content: '岩岳害羞地拿出一罐金黄色的蜂蜜："这是我偷偷采的野蜂蜜，整个部落最好的。都给你。"他说完就跑开了。',
          gain: 5, obsessionGain: 3 },
        { id: 'yanyue_story_3', minAffection: 60, title: '🐻 熊熊的梦想', locations: ['铁匠铺'],
          content: '岩岳一边打铁一边说："我以前只想打一辈子的铁，直到遇见你——我才发现，原来我还可以有别的梦想。"',
          gain: 6, obsessionGain: 4 },
        { id: 'yanyue_story_4', minAffection: 80, title: '🐻 星铁之约', locations: ['岩岳石洞'],
          content: '岩岳将一枚星铁戒指小心翼翼套在你手指上："这是我用陨铁打的，全世界只有这一枚。你愿意……做我这只笨熊的唯一吗？"',
          gain: 8, obsessionGain: 5 },
        { id: 'yanyue_story_5', minAffection: 50, title: '🐻 冬日暖炉', locations: ['岩岳石洞', '铁匠铺'],
          content: '寒冷的冬夜，岩岳在石洞里生起熊熊炉火，把最柔软的兽皮留给你坐。"别怕冷，有我在，这里永远暖和。"',
          gain: 5, obsessionGain: 3 },
    ],
    liuyun: [
        { id: 'liuyun_story_1', minAffection: 20, title: '🦅 云端的守望', locations: ['哨塔', '月崖'],
          content: '流云站在哨塔顶端，看到你来了，他轻轻拍了拍旁边的位置："上来吧，今天的云很美。"他的翅膀不自觉地为你挡住了风。',
          gain: 4, obsessionGain: 2 },
        { id: 'liuyun_story_2', minAffection: 40, title: '🦅 羽翼之下', locations: ['流云云巢'],
          content: '流云让你靠在他的羽翼下休息。他低声说："鹰族从不让人触碰翅膀……你是唯一的例外。"',
          gain: 5, obsessionGain: 3 },
        { id: 'liuyun_story_3', minAffection: 60, title: '🦅 远方的风景', locations: ['哨塔', '月崖'],
          content: '流云指着天边："我飞过很多地方，但从未觉得哪处风景值得停留。直到现在，我站在这里，看到你——哪里都不想去了。"',
          gain: 6, obsessionGain: 4 },
        { id: 'liuyun_story_4', minAffection: 80, title: '🦅 苍羽之诺', locations: ['流云云巢'],
          content: '流云将一枚刻着鹰羽图腾的银色戒指戴在你手上："苍羽鹰族的契约——以羽为证，以风为盟。你愿意，与我共守这片天空吗？"',
          gain: 8, obsessionGain: 5 },
        { id: 'liuyun_story_5', minAffection: 50, title: '🦅 黄昏共飞', locations: ['哨塔', '月崖'],
          content: '黄昏时分，流云带你飞上天空。"想不想看看兽世最美的日落？"他的翅膀稳稳托着你，风声在耳边呼啸。',
          gain: 5, obsessionGain: 3 },
    ],
    moli: [
        { id: 'moli_story_1', minAffection: 20, title: '🐍 药香之约', locations: ['密林', '巫医所'],
          content: '墨漓在竹楼前等你，手中拿着一包新配的安神药："你最近睡得不好。这是我调的，每晚喝一杯。"他的蛇尾轻轻碰了碰你的手。',
          gain: 4, obsessionGain: 2 },
        { id: 'moli_story_2', minAffection: 40, title: '🐍 碧鳞旧事', locations: ['巫医所', '密林'],
          content: '墨漓说起自己的过去："我曾是蛇族最不受待见的异类，独自活了数百年。直到有一天，你闯进了我的密林……"',
          gain: 5, obsessionGain: 3 },
        { id: 'moli_story_3', minAffection: 60, title: '🐍 蛇族的礼物', locations: ['密林'],
          content: '墨漓递给你一片发光的碧色鳞片："这是我心口最硬的鳞。送给你——它可以护你周全，就像我一直守在你身边。"',
          gain: 6, obsessionGain: 4 },
        { id: 'moli_story_4', minAffection: 80, title: '🐍 千年之约', locations: ['巫医所'],
          content: '墨漓将一枚用蛇骨打磨的戒指套在你的无名指上："碧鳞蛇族一千年才动一次心。你是我等了千年的那个人。"',
          gain: 8, obsessionGain: 5 },
        { id: 'moli_story_5', minAffection: 50, title: '🐍 雨后采药', locations: ['密林', '河边'],
          content: '雨后的密林弥漫着泥土的清香，墨漓带着你采药，不时回头确认你是否跟上。"跟紧我，别走丢了。"他轻声说。',
          gain: 5, obsessionGain: 3 },
    ]
};

// ========== ★ 男主支线任务 ==========
export const GUY_QUESTS = {
    cangye: [
        { id: 'cangye_quest_1', name: '🐺 狼族的信任', desc: '苍夜想让你认识狼群，但需要先获得狼群的认可。去月崖寻找狼群留下的印记。', 
          steps: [{ text: '去月崖探索（寻找狼群印记）', action: '月崖', check: () => state.player.actionCounts['moon_cliff'] >= 3 }],
          reward: { affection: 6, obsession: 2 }, nextQuest: 'cangye_quest_2' },
        { id: 'cangye_quest_2', name: '🐺 月崖之约', desc: '苍夜约你在满月之夜到月崖相见。等待夜晚的到来。',
          steps: [{ text: '在月崖静坐赏月（满月之夜触发）', action: '月崖', check: () => getDateInfo(state.player.day).weekDay === '周五' }],
          reward: { affection: 8, obsession: 3 }, nextQuest: 'cangye_quest_3' },
        { id: 'cangye_quest_3', name: '🐺 狼王的礼物', desc: '苍夜想送你一件亲手制作的礼物，需要你帮他收集材料：月崖上的月光石。',
          steps: [{ text: '在月崖采集月光石（探索时概率获得）', action: '月崖', check: () => state.player.inventory.some(i => i.includes('月光石')) }],
          reward: { affection: 10, obsession: 4 }, nextQuest: null },
    ],
    lieyang: [
        { id: 'lieyang_quest_1', name: '🐯 最强战士的考验', desc: '烈阳想看看你的实力，邀请你进行一场训练比试。',
          steps: [{ text: '在训练场和烈阳比试（体质≥25）', action: '训练场', check: () => state.player.stats.endurance >= 25 }],
          reward: { affection: 6, health: 10 }, nextQuest: 'lieyang_quest_2' },
        { id: 'lieyang_quest_2', name: '🐯 狩猎的伙伴', desc: '烈阳想带你去狩猎，但需要准备一把好弓。去铁匠铺打造一把弓箭。',
          steps: [{ text: '在铁匠铺打造弓箭（需要金币15）', action: '铁匠铺', check: () => state.player.gold >= 15 }],
          reward: { affection: 8, gold: 10 }, nextQuest: 'lieyang_quest_3' },
        { id: 'lieyang_quest_3', name: '🐯 虎族的祝福', desc: '烈阳想带你去月崖，在月光下接受虎族的祝福。',
          steps: [{ text: '和烈阳一起去月崖', action: '月崖', check: () => state.player.actionCounts['moon_cliff'] >= 2 }],
          reward: { affection: 10, obsession: 4 }, nextQuest: null },
    ],
    xuanyu: [
        { id: 'xuanyu_quest_1', name: '🦊 药草的指引', desc: '玄羽需要一种罕见的草药“夜光菌”，只有在密林深处才能找到。',
          steps: [{ text: '在密林寻找夜光菌（采集草药时概率获得）', action: '密林', check: () => state.player.inventory.some(i => i.includes('夜光菌')) }],
          reward: { affection: 6, talent: 3 }, nextQuest: 'xuanyu_quest_2' },
        { id: 'xuanyu_quest_2', name: '🦊 幻术的试炼', desc: '玄羽想教你幻术，但需要你证明自己有足够的直觉。去祭坛学习知识提升直觉。',
          steps: [{ text: '在萨满祭坛学习知识（直觉≥30）', action: '萨满祭坛', check: () => state.player.stats.intuition >= 30 }],
          reward: { affection: 8, intuition: 5 }, nextQuest: 'xuanyu_quest_3' },
        { id: 'xuanyu_quest_3', name: '🦊 九尾之誓', desc: '玄羽想带你去玄羽幻香居，展示他最后的秘密。',
          steps: [{ text: '前往玄羽幻香居', action: '玄羽幻香居', check: () => state.places.find(p => p.name === '玄羽幻香居')?.locked === false }],
          reward: { affection: 10, obsession: 4 }, nextQuest: null },
    ],
    yanyue: [
        { id: 'yanyue_quest_1', name: '🐻 铁匠的学徒', desc: '岩岳想教你锻造基础，但需要先从河边取来淬火用的水。',
          steps: [{ text: '去河边取水', action: '河边', check: () => state.player.actionCounts['fish'] >= 2 }],
          reward: { affection: 6, talent: 3 }, nextQuest: 'yanyue_quest_2' },
        { id: 'yanyue_quest_2', name: '🐻 星铁的秘密', desc: '岩岳发现了一块陨铁，但需要你帮忙去市场找一位商人换取锻打工具。',
          steps: [{ text: '去市场寻找商人（需要金币10）', action: '市场', check: () => state.player.gold >= 10 }],
          reward: { affection: 8, gold: 5 }, nextQuest: 'yanyue_quest_3' },
        { id: 'yanyue_quest_3', name: '🐻 熊族的守护', desc: '岩岳想送你一件亲手打造的护甲，需要你陪他去月崖采集兽骨。',
          steps: [{ text: '和岩岳一起去月崖采集兽骨', action: '月崖', check: () => state.player.actionCounts['moon_cliff'] >= 1 }],
          reward: { affection: 10, obsession: 4 }, nextQuest: null },
    ],
    liuyun: [
        { id: 'liuyun_quest_1', name: '🦅 高处的视野', desc: '流云想让你体验飞行的感觉，但需要你先克服对高处的恐惧。在哨塔上静坐。',
          steps: [{ text: '在哨塔登高望远（累计3次）', action: '哨塔', check: () => state.player.actionCounts['tower'] >= 3 }],
          reward: { affection: 6, endurance: 3 }, nextQuest: 'liuyun_quest_2' },
        { id: 'liuyun_quest_2', name: '🦅 风中的信物', desc: '流云想送你一根飞羽，但需要你先找到一片完整的苍鹰羽毛。',
          steps: [{ text: '在月崖寻找苍鹰羽毛（探索时概率获得）', action: '月崖', check: () => state.player.inventory.some(i => i.includes('羽毛')) }],
          reward: { affection: 8, charm: 3 }, nextQuest: 'liuyun_quest_3' },
        { id: 'liuyun_quest_3', name: '🦅 云巢之约', desc: '流云想带你去云巢看日出，这是他从未带任何人去过的地方。',
          steps: [{ text: '前往流云云巢', action: '流云云巢', check: () => state.places.find(p => p.name === '流云云巢')?.locked === false }],
          reward: { affection: 10, obsession: 4 }, nextQuest: null },
    ],
    moli: [
        { id: 'moli_quest_1', name: '🐍 药引之寻', desc: '墨漓需要一味罕见的药引“蛇涎果”，只在密林最深处的古树下生长。',
          steps: [{ text: '在密林寻找蛇涎果（采集时概率获得）', action: '密林', check: () => state.player.inventory.some(i => i.includes('蛇涎果')) }],
          reward: { affection: 6, health: 10 }, nextQuest: 'moli_quest_2' },
        { id: 'moli_quest_2', name: '🐍 碧鳞之血', desc: '墨漓想用他的血为你炼制一枚护身符，但需要你去河边取来清水。',
          steps: [{ text: '去河边取水', action: '河边', check: () => state.player.actionCounts['fish'] >= 1 }],
          reward: { affection: 8, endurance: 3 }, nextQuest: 'moli_quest_3' },
        { id: 'moli_quest_3', name: '🐍 蛇族的守护', desc: '墨漓想正式将你引入蛇族的庇护之下，需要你接受他的碧鳞印记。',
          steps: [{ text: '前往巫医所接受印记', action: '巫医所', check: () => state.places.find(p => p.name === '巫医所')?.locked === false }],
          reward: { affection: 10, obsession: 4 }, nextQuest: null },
    ]
};

// ========== ★ 场景探索收藏品 ==========
export const COLLECTIBLES = {
    '部落广场': [
        { id: 'col_plaza_1', name: '🗿 古兽图腾', desc: '广场中央的石柱上刻着古老的兽形图腾，据说是部落的守护神。' },
        { id: 'col_plaza_2', name: '🪙 祭祀铜币', desc: '在广场角落发现的古老铜币，上面铸着狼首纹样。' },
        { id: 'col_plaza_3', name: '📜 部落编年史', desc: '记录着部落百年历史的残卷，字迹已有些模糊。' },
    ],
    '训练场': [
        { id: 'col_training_1', name: '🗡️ 断剑残片', desc: '训练场角落发现的古老断剑，似乎来自上一个时代的战士。' },
        { id: 'col_training_2', name: '🐯 虎族护腕', desc: '烈阳遗落的护腕，边缘绣着赤金虎族的族徽。' },
        { id: 'col_training_3', name: '🏹 猎弓碎片', desc: '一把破裂的猎弓，弓臂上刻着密密麻麻的狩猎记录。' },
    ],
    '铁匠铺': [
        { id: 'col_forge_1', name: '🔨 上古铁砧', desc: '铁匠铺角落一块布满锈迹的铁砧，铭文显示它已有数百年历史。' },
        { id: 'col_forge_2', name: '💎 黑曜石锤', desc: '一把用黑曜石打造的小锤，岩岳说是他祖父的遗物。' },
        { id: 'col_forge_3', name: '🔥 火灵结晶', desc: '炉火旁发现的一块红色结晶，散发着温暖的光泽。' },
    ],
    '河边': [
        { id: 'col_river_1', name: '🪨 月光石', desc: '河底发现的会发光的石头，在月光下会泛出冰蓝色光泽。' },
        { id: 'col_river_2', name: '🐚 流水贝', desc: '一种罕见的河贝，壳内壁有天然的彩虹纹路。' },
        { id: 'col_river_3', name: '🌿 水灵石', desc: '长在河床上的透明石体，据说能净化水质。' },
    ],
    '市场': [
        { id: 'col_market_1', name: '🪙 异域银币', desc: '一枚刻着陌生文字的银币，可能是远方的商人遗落的。' },
        { id: 'col_market_2', name: '🧵 织梦丝', desc: '一束泛着微光的丝线，据说能织出入梦的布匹。' },
        { id: 'col_market_3', name: '📿 兽牙项链', desc: '一串由各种兽牙串成的项链，每颗牙背后都有一个故事。' },
    ],
    '月崖': [
        { id: 'col_mooncliff_1', name: '🌙 月华晶', desc: '月崖顶端的结晶，只在满月之夜才会发光。' },
        { id: 'col_mooncliff_2', name: '🪶 苍鹰之羽', desc: '流云的飞羽，在月光下泛着银色的光泽。' },
        { id: 'col_mooncliff_3', name: '🐺 狼牙护符', desc: '一枚刻着狼头图腾的狼牙，可能是苍夜留下的守护符。' },
    ],
    '密林': [
        { id: 'col_forest_1', name: '🍄 夜光菌', desc: '只在深夜发光的菌类，是炼制灵药的重要材料。' },
        { id: 'col_forest_2', name: '🌱 蛇涎果', desc: '墨漓最爱的药果，有着深绿色的光泽和苦涩的回甘。' },
        { id: 'col_forest_3', name: '🦋 幻光蝶', desc: '一种罕见的蝴蝶，翅膀上会浮现出幻术符文。' },
    ],
    '密林小径': [
        { id: 'col_path_1', name: '🍂 枯荣叶', desc: '一片永远不会腐烂的叶子，一面枯黄一面翠绿。' },
        { id: 'col_path_2', name: '🌸 永夜花', desc: '玄羽用幻术培育的花，永不凋谢，散发着幽蓝微光。' },
        { id: 'col_path_3', name: '🪶 幻羽', desc: '一片蕴含着幻术之力的羽毛，触碰时会看到奇异的幻象。' },
    ],
    '哨塔': [
        { id: 'col_tower_1', name: '🔭 远望镜', desc: '流云用过的望远镜，镜片被磨得光滑如镜。' },
        { id: 'col_tower_2', name: '🗺️ 云图', desc: '一张绘满云层走向的地图，流云说他花了一年才画完。' },
        { id: 'col_tower_3', name: '💨 风铃石', desc: '塔顶挂着的一串石铃，风吹过时会发出奇异的共鸣声。' },
    ],
    '萨满祭坛': [
        { id: 'col_altar_1', name: '🔮 预言石', desc: '一颗光滑的透明石头，据说能映照出未来的影像。' },
        { id: 'col_altar_2', name: '🕯️ 不灭烛', desc: '祭坛上不知燃烧了多少年的蜡烛，永远不灭。' },
        { id: 'col_altar_3', name: '📖 兽神之书', desc: '记载着兽世起源的古书，页面已经泛黄发脆。' },
    ],
    '温泉': [
        { id: 'col_hotspring_1', name: '💧 灵泉珠', desc: '温泉底部凝结的灵力结晶，散发着温热的光芒。' },
        { id: 'col_hotspring_2', name: '🪨 暖玉', desc: '一块被泉水冲刷了千百年的玉石，摸上去永远温热。' },
        { id: 'col_hotspring_3', name: '🌿 泉心草', desc: '只在温泉中心生长的灵草，叶片呈半透明状。' },
    ],
    '花田': [
        { id: 'col_flower_1', name: '🌺 七彩花', desc: '一株能变换七种颜色的奇花，只在正午时分绽放。' },
        { id: 'col_flower_2', name: '🍯 蜜源石', desc: '花田间一块被蜜蜂包围的石头，散发着甜香。' },
        { id: 'col_flower_3', name: '🦋 花灵蝶', desc: '一种与花共生的灵蝶，翅膀上印着花田的图案。' },
    ],
    '山涧瀑布': [
        { id: 'col_waterfall_1', name: '💎 水之心', desc: '瀑布水潭底部的一颗蓝色宝石，像一滴凝固的水。' },
        { id: 'col_waterfall_2', name: '🌊 涟漪石', desc: '一块不断荡起涟漪的石头，即使离开水面也不会停止。' },
        { id: 'col_waterfall_3', name: '🐉 水灵珠', desc: '瀑布冲刷千万年形成的灵珠，蕴含着澎湃的水灵之力。' },
    ],
    '古树广场': [
        { id: 'col_tree_1', name: '🌳 古树之心', desc: '古树树干中藏着的一颗木质心脏，还带着温度。' },
        { id: 'col_tree_2', name: '📜 树皮卷', desc: '一块刻满古老符号的树皮，可能是古树精灵留下的文字。' },
        { id: 'col_tree_3', name: '🍃 生命之叶', desc: '一片永远不会枯萎的叶子，散发着淡淡的生命气息。' },
    ],
};

// ========== 原有数据 ==========
export const statInfo = {
    health: { icon: '❤️', name: '生命', desc: '生命值，低于阈值可能生病' },
    charm: { icon: '💖', name: '魅力', desc: '提高偶遇男主概率' },
    intuition: { icon: '🔮', name: '直觉', desc: '提高解锁男主概率' },
    endurance: { icon: '🛡️', name: '体质', desc: '体质越高越不容易生病受伤' },
    talent: { icon: '🎨', name: '才艺', desc: '自制礼物品质，照顾伤员效果提升' },
    affinity: { icon: '🤝', name: '亲和', desc: '集市交易折扣，部落情报获取' }
};

export const beastWorldKnowledge = [
    '兽人部落的图腾柱上刻着古老的预言。',
    '玄羽曾告诉你，九尾狐族的寿命可达千年。',
    '部落长老说，暗影森林深处封印着上古魔兽。',
    '发光蘑菇可治疗轻伤，紫色毒蕈需远离。',
    '兽世由肉食兽人统治，弱肉强食是这里的基本法则。',
    '兽世的季节：春季温暖，夏季炎热，雨季绵长，冬季寒冷。',
    '星象可以预测天灾，但解读需要极高的直觉。',
    '兽人成年礼需要独自狩猎一头猛兽。',
    '月光宝石蕴藏着古老的治愈之力。',
    '每年的星见之夜，死去的先祖会通过流星与活人对话。'
];

export const firstMeetStories = {
    cangye: `<h2>🐺 初遇苍夜</h2><p>月崖之上，孤狼独啸。你循声登上崖顶，月光洒在银白色的巨狼身上。他缓缓转过身，冰蓝的眼眸中闪过一丝警惕与好奇。“你是那个来自异世的人类？”他的狼尾微微摆动。</p>`,
    lieyang: `<h2>🐯 初遇烈阳</h2><p>训练场上，一只橙黑条纹的猛虎正在独自练习扑击。他注意到你，立刻变回人形，露出灿烂的笑容：“嘿！你就是部落新来的那个女孩？要不要一起练练？”</p>`,
    xuanyu: `<h2>🦊 初遇玄羽</h2><p>密林深处，一只九尾黑狐正蹲在古树下。他抬起头，狭长的狐狸眼眯了起来。“哎呀，迷路的小家伙。需要我送你出去吗？”</p>`,
    yanyue: `<h2>🐻 初遇岩岳</h2><p>铁匠铺里炉火熊熊，一个魁梧的身影正在捶打烧红的铁块。他停下手中的活，转过身来，憨厚地笑了笑：“小心，这里烫。”</p>`,
    liuyun: `<h2>🦅 初遇流云</h2><p>哨塔之巅，一只苍鹰正迎着风站立。他展开双翼，轻盈地落在你面前，语气冷淡：“这里不是你该来的地方。”但他的翅膀却不动声色地为你挡住了强风。</p>`,
    moli: `<h2>🐍 初遇墨漓</h2><p>你因重伤昏迷，一股清凉的药香渗入鼻尖。睁开眼，一条碧鳞大蛇正盘绕在身侧。它缓缓变回人形——一位墨发垂肩的青年，唇角噙着若有若无的笑意。</p>`
};

export const soulOathStories = {
    cangye: `<h2>🐺 苍夜 · 灵魂之誓</h2><p>满月之夜，苍夜带你来到月崖最高处。他化作银白巨狼，仰天长啸，月光如银河倾泻，将你们笼罩其中。</p><p>他变回人形，单膝跪地，在掌心划出一道血痕。"以我苍夜之名起誓。今生今世，我愿用生命守护你，用灵魂铭记你。"</p>`,
    lieyang: `<h2>🐯 烈阳 · 灵魂之誓</h2><p>清晨的阳光洒在训练场上，烈阳换上了最隆重的兽皮战甲，单膝跪下。"我烈阳，赤金虎族最强战士，今天在太阳神和兽神的见证下，向你起誓！"</p>`,
    xuanyu: `<h2>🦊 玄羽 · 灵魂之誓</h2><p>幻香居内，九盏魂灯依次亮起。玄羽立于灯阵中央，九条尾巴缓缓展开。"以我玄羽之名，以九尾玄狐千年修为为凭，在此立下灵魂誓约。"</p>`,
    yanyue: `<h2>🐻 岩岳 · 灵魂之誓</h2><p>铁匠铺的炉火熊熊燃烧，岩岳将护符放入熔炉中，滴入自己的鲜血。"我岩岳，大地熊族后裔，以这枚用我鲜血锻造的戒指起誓——这辈子，我只爱你一个人。"</p>`,
    liuyun: `<h2>🦅 流云 · 灵魂之誓</h2><p>云巢之巅，流云展开双翼，逆风而立。"苍羽鹰族流云，以风之名起誓。这片天空若没有你，再高再远也没有意义。"</p>`,
    moli: `<h2>🐍 墨漓 · 灵魂之誓</h2><p>竹楼深处，墨漓将一枚碧绿的鳞片放在你掌心。"以我墨漓之名，以千年碧鳞蛇族的先祖为证。你愿意，让我用余生守护你吗？"</p>`
};

export const confessionStories = {
    cangye: `<h2>🐺 苍夜的告白</h2><p>月崖之上，苍狼独立。他缓缓转过身，那双冰蓝色的眼睛注视着你。“狼族一生只认一个伴侣，而我，在遇见你的那一刻，就已经做出了选择。”<br><br>“你愿意，成为我的伴侣吗？”</p>`,
    lieyang: `<h2>🐯 烈阳的告白</h2><p>训练场的沙地上，烈阳已经来回踱步了不知多少圈。看到你走来，他的耳朵猛地竖起。<br><br>“我喜欢你！从第一天看到你，我就喜欢你了！你愿意和我在一起吗？”</p>`,
    xuanyu: `<h2>🦊 玄羽的告白</h2><p>幻香居内，玄羽倚在竹帘旁，手中把玩着一朵散发幽光的奇花。“我活了两百多年，漫长的岁月里，我习惯了独自一人。但遇见你之后，我开始害怕孤独。你愿意，成为我漫长生命里唯一的色彩吗？”</p>`,
    yanyue: `<h2>🐻 岩岳的告白</h2><p>铁匠铺的炉火映红了石壁，岩岳捧着戒指递到你面前。“我不会说好听的话。但以后你的锅破了，我给你补；屋子漏了，我给你修；冬天冷，我变成熊给你暖脚。”<br><br>“你愿意……和我一起过吗？”</p>`,
    liuyun: `<h2>🦅 流云的告白</h2><p>哨塔顶端的风格外强劲，流云从羽翼间取出一根最长的飞羽。“我不懂什么甜言蜜语。但如果你想看更远的风景，我的背永远给你。如果你愿意的话。”<br><br>“你愿意吗？”</p>`,
    moli: `<h2>🐍 墨漓的告白</h2><p>竹楼内药香袅袅，墨漓斜倚在竹榻上，手中捻着一株紫草。“你知道我为什么总是救你吗？因为从第一次见到你，我就舍不得让你再受伤了。”<br><br>“这是碧鳞蛇族的定情草，一生只赠一人。你愿意，收下它吗？”</p>`
};

export const unrequitedStories = {
    cangye: `<h2>🐺 苍夜·爱而不得</h2><p>苍夜望着你离去的背影，那双冰蓝色的眼眸终于黯淡了下去。“或许……这才是最好的结局。愿你幸福。”他对着空无一人的洞穴轻声说道。</p>`,
    lieyang: `<h2>🐯 烈阳·爱而不得</h2><p>烈阳站在木屋门口，看着你和另一个人的背影渐渐远去。“只要你开心就好。”他勉强扯出一个笑容。</p>`,
    xuanyu: `<h2>🦊 玄羽·爱而不得</h2><p>玄羽倚在幻香居的竹帘旁，看着你逐渐远去的身影。“两百年了，我以为终于找到了归宿。愿你此生，有人相伴。”</p>`,
    yanyue: `<h2>🐻 岩岳·爱而不得</h2><p>岩岳站在石洞口，大手紧紧攥着门框。“我……祝你们幸福。”</p>`,
    liuyun: `<h2>🦅 流云·爱而不得</h2><p>流云站在云巢边缘，看着你乘着别人的风远去。“飞吧。”他轻轻松手，那根飞羽被风卷入云海。</p>`,
    moli: `<h2>🐍 墨漓·爱而不得</h2><p>墨漓站在竹楼前，低头看着掌心的定情草，轻轻碾碎。“罢了，我本就是独居之人。”</p>`
};

export const imprisonmentStories = {
    cangye: `<h2>🐺 苍夜的囚笼</h2><p>月光如水，从洞顶的缝隙倾泻而下。苍夜不知何时已化作银白色的巨狼，将你圈在温暖的腹侧。“外面太危险了。”石壁上刻满了你的名字。</p>`,
    lieyang: `<h2>🐯 烈阳的囚笼</h2><p>木屋里弥漫着松脂和阳光的味道。烈阳将你轻轻放在铺满虎皮的榻上，他的虎尾却紧紧地缠住了你的脚踝。</p>`,
    xuanyu: `<h2>🦊 玄羽的囚笼</h2><p>幻香居内，玄羽倚在软榻上，一手托腮。“放心，我不会伤害你。我只是想让你留在这里，陪我一起看遍岁月流转。”</p>`,
    yanyue: `<h2>🐻 岩岳的囚笼</h2><p>石洞里温暖如春，洞口被一块巨石堵住。“外面冷，别出去。”他将一件厚厚的熊皮披在你肩上。</p>`,
    liuyun: `<h2>🦅 流云的囚笼</h2><p>高崖之上的云巢，流云站在巢边。“这里很高，但你很安全。”他的翅膀悄悄为你挡了风。</p>`,
    moli: `<h2>🐍 墨漓的囚笼</h2><p>竹楼深处药雾弥漫，墨漓将你安置在柔软的竹榻上。“你的身体太弱了，需要长期调养。就留在这里吧。”</p>`
};

export const ALL_ENDINGS = [
    { id: 'prison_cangye', name: '苍夜·囚禁', icon: '🐺', desc: '被苍夜囚禁于狼穴。' },
    { id: 'prison_lieyang', name: '烈阳·囚禁', icon: '🐯', desc: '被烈阳锁在木屋。' },
    { id: 'prison_xuanyu', name: '玄羽·囚禁', icon: '🦊', desc: '陷入玄羽的幻术囚笼。' },
    { id: 'prison_yanyue', name: '岩岳·囚禁', icon: '🐻', desc: '被岩岳守护在石洞中。' },
    { id: 'prison_liuyun', name: '流云·囚禁', icon: '🦅', desc: '被流云带到高崖云巢。' },
    { id: 'prison_moli', name: '墨漓·囚禁', icon: '🐍', desc: '被墨漓困于药雾弥漫的竹楼。' },
    { id: 'he_cangye', name: '苍夜·灵魂相伴', icon: '🐺', desc: '与苍夜缔结灵魂契约。' },
    { id: 'he_lieyang', name: '烈阳·灵魂相伴', icon: '🐯', desc: '与烈阳缔结灵魂契约。' },
    { id: 'he_xuanyu', name: '玄羽·灵魂相伴', icon: '🦊', desc: '与玄羽缔结灵魂契约。' },
    { id: 'he_yanyue', name: '岩岳·灵魂相伴', icon: '🐻', desc: '与岩岳缔结灵魂契约。' },
    { id: 'he_liuyun', name: '流云·灵魂相伴', icon: '🦅', desc: '与流云缔结灵魂契约。' },
    { id: 'he_moli', name: '墨漓·灵魂相伴', icon: '🐍', desc: '与墨漓缔结灵魂契约。' },
    { id: 'hidden_unrequited_cangye', name: '苍夜·爱而不得', icon: '🐺', desc: '苍夜将你囚禁，你选择了离开。' },
    { id: 'hidden_unrequited_lieyang', name: '烈阳·爱而不得', icon: '🐯', desc: '烈阳将你囚禁，你选择了离开。' },
    { id: 'hidden_unrequited_xuanyu', name: '玄羽·爱而不得', icon: '🦊', desc: '玄羽将你囚禁，你选择了离开。' },
    { id: 'hidden_unrequited_yanyue', name: '岩岳·爱而不得', icon: '🐻', desc: '岩岳将你囚禁，你选择了离开。' },
    { id: 'hidden_unrequited_liuyun', name: '流云·爱而不得', icon: '🦅', desc: '流云将你囚禁，你选择了离开。' },
    { id: 'hidden_unrequited_moli', name: '墨漓·爱而不得', icon: '🐍', desc: '墨漓将你囚禁，你选择了离开。' }
];

export const ACHIEVEMENTS = [
    { id: 'first_explore', name: '初来乍到', desc: '完成第一次探索', icon: '👣' },
    { id: 'collector', name: '毛茸茸收藏家', desc: '解锁全部五位男主', icon: '🎖️' },
    { id: 'peacemaker', name: '和平使者', desc: '成功劝架一次', icon: '🕊️' },
    { id: 'scholar', name: '兽世学者', desc: '在祭坛学习知识累计10次', icon: '📚' },
    { id: 'gift_master', name: '礼物达人', desc: '送出礼物累计15次', icon: '🎁' },
    { id: 'exercise_fan', name: '健身狂人', desc: '在训练场锻炼累计20次', icon: '💪' },
    { id: 'social_butterfly', name: '社交蝴蝶', desc: '与居民聊天累计15次', icon: '🦋' },
    { id: 'shopaholic', name: '购物狂', desc: '在市场购买礼物累计15次', icon: '🛍️' },
    { id: 'smith_helper', name: '铁匠助手', desc: '在铁匠铺帮忙锻造累计10次', icon: '🔨' },
    { id: 'fisherman', name: '渔夫精神', desc: '在河边抓鱼累计10次', icon: '🎣' },
    { id: 'moon_cliff_regular', name: '月崖常客', desc: '在月崖静坐赏月累计10次', icon: '🌙' },
    { id: 'hotspring_lover', name: '温泉爱好者', desc: '泡温泉累计10次', icon: '♨️' },
    { id: 'forest_explorer', name: '密林探索者', desc: '在密林小径探索累计10次', icon: '🌿' },
    { id: 'tower_watcher', name: '哨塔守望者', desc: '在哨塔登高望远累计10次', icon: '🗼' },
    { id: 'square_regular', name: '广场常客', desc: '在部落广场帮忙累计10次', icon: '🏛️' },
    { id: 'survival_expert', name: '生存专家', desc: '生命值上限提升到100', icon: '❤️' },
    { id: 'iron_body', name: '钢铁之躯', desc: '体质达到100', icon: '🛡️' },
    { id: 'popular', name: '万人迷', desc: '魅力达到100', icon: '💖' },
    { id: 'prophet', name: '先知', desc: '直觉达到100', icon: '🔮' },
    { id: 'artist', name: '艺术家', desc: '才艺达到100', icon: '🎨' },
    { id: 'diplomat', name: '外交官', desc: '亲和达到100', icon: '🤝' },
    { id: 'max_all', name: '全属性满值', desc: '所有属性达到100', icon: '👑' },
    { id: 'long_lasting', name: '天长地久', desc: '游戏天数达到100天', icon: '📅' },
    { id: 'diary_writer', name: '日记达人', desc: '写日记累计20次', icon: '📝' },
    { id: 'craft_master', name: '制作高手', desc: '制作礼物累计20次', icon: '🧸' },
    { id: 'bulletin_reader', name: '公告读者', desc: '查看公告累计15次', icon: '📋' },
    { id: 'rumor_monger', name: '消息灵通', desc: '打听消息累计15次', icon: '🗣️' },
    { id: 'astrologer', name: '占星师', desc: '观星占卜累计10次', icon: '🌟' },
    { id: 'sky_watcher', name: '观天者', desc: '观察天象累计10次', icon: '☁️' },
    { id: 'herb_expert', name: '草药专家', desc: '采集药草累计10次', icon: '🍄' },
    { id: 'collector_master', name: '收藏大师', desc: '收集到20件收藏品', icon: '🏺' },
    { id: 'quest_master', name: '任务达人', desc: '完成5个支线任务', icon: '📋' },
];

export const HIDDEN_ACHIEVEMENTS = [
    { id: 'flower_heart', name: '花心的坏女人', desc: '在同一局中被四位不同男主囚禁后达成任意结局', icon: '😈' }
];

// ========== NPC 互动文本（扩充） ==========
export const NPC_INTERACTIONS = {
    elder: {
        greet: '大长老拄着木杖，慈祥地看着你：“孩子，你来了。今天想听什么故事？”',
        talk: ['大长老抚摸图腾柱：“兽神诞日快到了，记得来祭坛祈福。”', '大长老缓缓说道：“雨季的狩猎季，是兽人最神圣的时刻。”', '大长老看着你：“你身上有异世的灵气，或许这正是兽神指引你来到这里的理由。”', '大长老轻叹一声：“年轻的时候，我也曾像烈阳那样冲动。”', '大长老翻开一本泛黄的古籍：“这是兽世最古老的药典。”'],
        affectionGain: 4
    },
    xiaoman: {
        greet: '小蔓微笑着向你打招呼：“你来啦！要不要帮你看看身体？”',
        talk: ['小蔓边捣药边说：“雨季快来了，要注意防潮。”', '小蔓神秘地压低声音：“我听说苍夜昨晚又独自去月崖了。”', '小蔓递给你一包草药：“这是安神茶，睡前喝一杯。”', '小蔓笑着说：“岩岳又打了一把新锄头，可好用了。”', '小蔓望着远方：“真羡慕你能到处冒险。”'],
        affectionGain: 3
    },
    aluo: {
        greet: '阿洛扛着一头鹿从你身边走过：“嘿，小姑娘，今天运气不错！”',
        talk: ['阿洛擦了擦弓弦：“狩猎季我们要去林子里待一个月。”', '阿洛拍拍你的肩：“你要是想学射箭，我可以教你。”', '阿洛挠头笑道：“烈阳那小子最近总在训练场上傻笑。”', '阿洛压低声音：“听说密林深处出现了新的兽群。”', '阿洛哈哈大笑：“今天猎到了一头大野猪！”'],
        affectionGain: 2
    },
    xiaomei: {
        greet: '小梅蹦蹦跳跳地跑到你面前：“姐姐！给我讲故事好不好！”',
        talk: ['小梅眨着大眼睛：“爷爷说森林里住着会发光的鹿。”', '小梅拉着你的衣角：“狩猎节的时候，猎人们可威风了！”', '小梅悄悄告诉你：“其实我喜欢阿洛哥哥。”', '小梅捧着一把野花：“送给你！这是我在河边采的！”', '小梅好奇地问：“外面的世界是什么样的？”'],
        affectionGain: 1
    }
};

// ========== 约会内容 ==========
export const DATE_CONTENTS = {
    cangye: {
        '月崖': { title: '月下狼影', content: '月崖之上，银辉如水。苍夜早已在那里等候，他的银白长发在夜风中轻轻飘扬，狼耳微微转动，捕捉着你的脚步声。\n\n“你来了。”他转过身，冰蓝的眼眸在月光下显得格外深邃。他的尾巴不自觉地轻轻摆动——那是狼族表达喜悦的方式。\n\n他带你走到崖边，那里铺着一张柔软的兽皮，上面放着几块烤得金黄的肉干和一壶温热的草药茶。“我知道你喜欢月亮，所以选了这里。”他的声音低沉而温柔，与平日里的威严截然不同。\n\n你们并肩坐下，他指着天边最亮的那颗星说：“那颗星，我们狼族称之为‘守望星’。传说每一个狼族勇士都会在死后化作一颗星，守护自己最爱的人。”\n\n他转头看你，目光认真而炽热。“我父亲曾告诉我，当你找到愿意与之分享月光的人，就抓住她，别放手。”他轻轻握住你的手，“我抓住了，你不会逃吧？”\n\n他的狼尾悄悄圈住你的腰，像是一个无声的承诺。你们在月下静静坐了许久，直到晨光初现，他才依依不舍地松开你。', affectionGain: 8, obsessionGain: 3 },
        '苍夜之窟': { title: '狼王之巢', content: '苍夜的洞穴比想象中要温暖许多。洞壁上挂着几块兽皮，地上铺着厚厚的干草和柔软的毛皮，空气中弥漫着淡淡的松脂和野花的味道。\n\n他有些局促地站在洞口，耳朵微微向后压。“这里……有点简陋。”他低声说。\n\n你环顾四周，看到石壁上刻着许多狼的图案。他解释道：“这是先祖留下的图腾，据说能保佑洞穴的主人找到真爱。”\n\n他领你走到洞穴深处，那里有一个小小的火塘，火苗跳跃着，驱散了潮气。他从一个角落取出一个木盒，打开，里面是一对用狼牙和月光石打磨的耳环。“我试着做的。”他低下头，耳朵尖泛红。\n\n你戴上耳环，他抬起头，眼中闪过一丝惊喜。“很适合你。”他轻轻搂住你，将下巴搁在你的头顶。“我不知道未来会怎样，但我会用生命保护你。”', affectionGain: 10, obsessionGain: 4 }
    },
    lieyang: {
        '训练场': { title: '烈阳之约', content: '训练场上，烈阳赤着上身，汗水顺着肌肉的沟壑滑落。他正对着一个木桩练习拳击，每一拳都带着风声。看到你，他立刻停下，随手抓起旁边的毛巾擦了把汗，露出标志性的灿烂笑容。\n\n“你来了！我等你半天了！”他跑过来，虎尾兴奋地左右甩动，“今天教你一个新招式！”\n\n他耐心地示范动作，讲解发力技巧，时不时会不小心碰到你的手或肩膀，每次都红着脸缩回去。当你终于打出像样的一拳时，他比你还高兴，大声叫好。\n\n“你真有天赋！”他拍了拍你的肩，“以后天天来，我包教包会！”他顿了顿，虎尾轻轻卷住你的手腕，“其实……我就是想找借口多见见你。”', affectionGain: 8, obsessionGain: 3 },
        '烈阳木屋': { title: '虎巢暖阳', content: '烈阳的木屋充满了阳光和松香的味道。墙上挂着各种兽角和兽皮，地上铺着厚厚的干草。\n\n他手忙脚乱地收拾着桌上的杂物，嘴里嘟囔着：“哎呀，有点乱……”虎尾尴尬地贴在身后。\n\n他让你坐在最舒适的兽皮垫子上，端来一壶热茶和几块烤饼。“我特意学的烤饼，你尝尝。”\n\n你咬了一口，味道出奇的好。他高兴得尾巴直晃。“太好了！我还怕你不喜欢！”他坐在你对面，双手撑着下巴，眼神亮晶晶地看着你。“你知道吗，我第一次在训练场看到你，就被你吸引了。”', affectionGain: 10, obsessionGain: 4 }
    },
    xuanyu: {
        '密林小径': { title: '狐影迷踪', content: '密林小径上，雾气缭绕，花草清香。玄羽倚在一棵古树旁，九条尾巴在身后优雅地摆动，手中把玩着一片发光的叶子。他看到你，狐狸眼微弯，嘴角勾起一个狡黠的弧度。\n\n“你来了，迷路的小家伙。”他轻轻晃了晃手中的叶子，“这是‘流光叶’，只有在月圆之夜才会发光。我特意为你采的。”\n\n他牵着你的手走进密林深处，那里有一个被藤蔓环绕的小空地，中央放着一张藤编的小桌，上面摆着几碟精致的点心和一壶花茶。“这里是我的秘密花园，除了你，没人知道。”\n\n他为你倒上一杯花茶，香气馥郁。“我活了两百多年，见惯了人来人往，可你……你让我觉得，时间不再是负担，而是礼物。”', affectionGain: 9, obsessionGain: 4 },
        '玄羽幻香居': { title: '幻香秘境', content: '玄羽的幻香居仿佛不在凡间。紫色薄纱从高处垂下，随风轻舞，空气中弥漫着奇异的药香和花香。九盏魂灯散发着幽蓝的微光。\n\n玄羽引你坐在一张软榻上，自己则坐在你对面。“这座幻香居是我亲手建造的，可这里一直缺少一样东西。”他睁开眼，狐狸眼凝视着你，“缺少了你的气息。”\n\n他缓缓起身，走到你面前，从怀中取出一枚泛着紫光的玉佩。“这是用我千年修为凝聚的护身符，送给你。戴上它，无论你身在何处，我都能感知到你的危险和喜乐。”', affectionGain: 12, obsessionGain: 5 }
    },
    yanyue: {
        '铁匠铺': { title: '炉火之约', content: '铁匠铺里炉火正旺，岩岳赤裸着上身，露出结实的肌肉，正用力捶打着一块烧红的铁块。他看到你，放下铁锤，用围裙擦了擦额头上的汗。\n\n“来得正好！”他憨厚地笑了笑，“我正在给你打一件东西。”他走到一旁的工作台，拿起一枚精巧的戒指——戒面是一颗打磨成心形的红宝石。“这是用火山岩里的铁和鲜血淬炼的，能辟邪。”\n\n你接过戒指，他耳根烧得通红。“我嘴笨，不会说什么好听话。但只要你喜欢，我可以每天给你打一个小东西。冬天我会生火暖屋，夏天我会给你遮荫。你……愿意和我这样的笨熊在一起吗？”', affectionGain: 8, obsessionGain: 3 },
        '岩岳石洞': { title: '熊洞暖居', content: '岩岳的石洞温暖如春，墙角堆满了劈好的木柴，炉火噼啪作响。\n\n岩岳让你坐在火堆旁铺好兽皮的石凳上，端来一碗热气腾腾的蜂蜜汤。“刚熬好的，加了些山参，喝了暖和。”\n\n“我冬天不太爱出门，大部分时间都窝在洞里。”他憨憨一笑，“所以我准备了好多东西，够两个人吃一整个冬天。”\n\n他站起身，搬出一个大箱子，打开，里面是各种各样的手工制品：木雕的小熊、石磨的碗、铜制的簪子……“这些都是给你做的，想着你可能会喜欢。”', affectionGain: 10, obsessionGain: 4 }
    },
    liuyun: {
        '哨塔': { title: '高处风语', content: '哨塔之巅，风呼啸而过。流云站在塔边，苍鹰的羽翼在风中微微展开，金色的瞳孔锐利地扫视着远方。\n\n“你来了。”他的语气依旧平淡，但翅膀尖却悄悄向你靠近，为你挡住了高处的强风。“今天天气很好，能看到远处的雪山。”\n\n他顿了顿，从翼间取出一根最长的飞羽。“这是我的初羽，出生时落下的第一根羽毛，据说能庇护所爱之人。”他递到你面前，“我……我不懂怎么讨人欢心，但如果你愿意收下它，我就会用生命守护你。”', affectionGain: 9, obsessionGain: 3 },
        '流云云巢': { title: '云巢之梦', content: '流云的云巢在高崖之上，四面只有风与云。巢穴用干草和柔软的树藤编织而成，铺着厚厚的羽毛和兽皮。\n\n你有些紧张地坐在巢边，流云站在巢口，张开宽大的羽翼，为你挡住刺眼的阳光。“这里很安全，不会有人打扰。”\n\n他让你躺下来，指着天空：“你看，云在移动，像不像一条河流？”他侧过身，翅膀轻轻覆在你身上。“我从小喜欢看云，我以为我会永远一个人看云，直到你出现。”', affectionGain: 10, obsessionGain: 4 }
    },
    moli: {
        '密林': { title: '蛇林秘语', content: '密林深处，雾气弥漫，药草香浓郁。墨漓倚在一株古木旁，碧鳞蛇尾轻轻缠绕在树干上，手中把玩着一朵散发幽光的蘑菇。\n\n“你来了。”他的声音带着几分慵懒，蛇尾缓缓松开树干，向你伸来，轻轻触碰你的手腕。“最近身体如何？”\n\n他从怀中取出一枚用翡翠般的鳞片串成的项链。“这是我蜕下的碧鳞，含有我的精血，佩戴在身上能百毒不侵。”他亲手为你戴上。“这林子里的毒物不少，有了它，你可以自由穿行。当然，我私心也希望你能常来……这里只有我一个人，很寂寞。”', affectionGain: 9, obsessionGain: 4 },
        '巫医所': { title: '竹楼药香', content: '巫医所竹楼里药雾缭绕，墨漓站在药架前，手指轻轻掠过一排排陶罐，最终取下一个青瓷瓶，倒出一粒碧绿色的药丸。\n\n“这是‘碧凝丹’，用了三十年功力的药引。”他将药丸递到你唇边，“你体质偏弱，每个月吃一颗，慢慢调理。”\n\n他靠回竹榻，蛇尾慵懒地搭在扶手上。“我这条命是捡来的，所以格外珍惜。可遇见你之后，我觉得那些年独自熬过的时间，都变得有意义了。”', affectionGain: 12, obsessionGain: 5 }
    }
};

export const DEFAULT_DATE = {
    title: '浪漫约会',
    content: '你和他度过了愉快的时光。你们聊了很多，从部落的趣事到彼此的理想。他看你的眼神比平时更加温柔，似乎在默默许下什么承诺。临别时，他轻轻握住你的手，低声说：“下次，还想和你见面。”',
    affectionGain: 5,
    obsessionGain: 2
};