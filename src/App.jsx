import { useState, useRef, useEffect, useCallback } from "react";
import { apiFetch, fetchAuthConfig, getStoredAccessKey, setStoredAccessKey, getClientId, fetchConversations, fetchConversation, deleteConversation } from "./api.js";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

/* ── EMBEDDED DATA ─────────────────────────────────────────── */
const D = {"metadata": {"datasetName": "IHS Light Vehicle Production Base Global", "files": [{"tag": "2025M05", "pubDate": "Jun-03-2025", "programs": 8704}, {"tag": "2025M06", "pubDate": "Jul-03-2025", "programs": 8745}, {"tag": "2025M07", "pubDate": "Aug-04-2025", "programs": 8730}, {"tag": "2025M08", "pubDate": "Sep-04-2025", "programs": 8738}, {"tag": "2025M09", "pubDate": "Oct-07-2025", "programs": 8770}, {"tag": "2025M10", "pubDate": "Nov-04-2025", "programs": 8784}, {"tag": "2025M11", "pubDate": "Dec-04-2025", "programs": 8602}, {"tag": "2025M12", "pubDate": "Jan-05-2026", "programs": 8666}, {"tag": "2026M01", "pubDate": "Feb-04-2026", "programs": 8708}, {"tag": "2026M02", "pubDate": "Mar-05-2026", "programs": 8738}, {"tag": "2026M03", "pubDate": "Apr-03-2026", "programs": 8830}, {"tag": "2026M04", "pubDate": "May-12-2026", "programs": 8894}], "latestFile": "2026M04", "unit": "vehicles", "cyYearsAvailable": ["CY 2021", "CY 2022", "CY 2023", "CY 2024", "CY 2025", "CY 2026", "CY 2027", "CY 2028", "CY 2029", "CY 2030", "CY 2031", "CY 2032", "CY 2033", "CY 2034", "CY 2035"], "monthlyDataRange": "Jan 2024 to Dec 2027", "dimensions": {"regions": ["Europe", "Greater China", "Japan/Korea", "Middle East/Africa", "North America", "South America", "South Asia"], "productionTypes": ["LCV", "PC"], "bodytypes": ["Car", "MPV", "PUP", "SPORT", "SUV", "Van"], "segments": ["A-Segment", "B-Segment", "C-Segment", "Compact Full-Frame", "D-Segment", "E-Segment", "Full-Size Full-Frame", "Mini Full-Frame"], "priceClasses": ["Entry", "Mid", "Others", "Premium", "Ultra Low"], "assemblyTypes": ["CBU", "CKD"]}}, "revisions": {"global": {"CY 2024": {"2025M05": 89474961, "2025M06": 89475055, "2025M07": 89581229, "2025M08": 89581229, "2025M09": 89585079, "2025M10": 89591960, "2025M11": 89591960, "2025M12": 89593874, "2026M01": 89593874, "2026M02": 89592074, "2026M03": 89592074, "2026M04": 89588523}, "CY 2025": {"2025M05": 88257475, "2025M06": 89176456, "2025M07": 89919169, "2025M08": 90369980, "2025M09": 91081070, "2025M10": 91379651, "2025M11": 91858383, "2025M12": 92440811, "2026M01": 92926430, "2026M02": 93045202, "2026M03": 93055223, "2026M04": 93067455}, "CY 2026": {"2025M05": 88920993, "2025M06": 89517426, "2025M07": 89590137, "2025M08": 89613891, "2025M09": 90546851, "2025M10": 90967542, "2025M11": 91246596, "2025M12": 91948882, "2026M01": 92588745, "2026M02": 92814827, "2026M03": 92129792, "2026M04": 91377574}, "CY 2027": {"2025M05": 91686923, "2025M06": 92234882, "2025M07": 91822679, "2025M08": 91760661, "2025M09": 92335007, "2025M10": 92727991, "2025M11": 92723463, "2025M12": 93373793, "2026M01": 94098790, "2026M02": 94095126, "2026M03": 93552202, "2026M04": 92781543}}, "byRegion": {"Europe": {"CY 2024": {"2025M05": 17174845, "2025M06": 17174845, "2025M07": 17174845, "2025M08": 17174845, "2025M09": 17174845, "2025M10": 17174845, "2025M11": 17174845, "2025M12": 17174845, "2026M01": 17174845, "2026M02": 17172930, "2026M03": 17172930, "2026M04": 17169229}, "CY 2025": {"2025M05": 16633368, "2025M06": 16651550, "2025M07": 16741660, "2025M08": 16798985, "2025M09": 16876621, "2025M10": 16869033, "2025M11": 16888562, "2025M12": 16920118, "2026M01": 16977230, "2026M02": 17031029, "2026M03": 17037836, "2026M04": 17047535}, "CY 2026": {"2025M05": 16704623, "2025M06": 16740776, "2025M07": 16795764, "2025M08": 16713177, "2025M09": 16830200, "2025M10": 16836465, "2025M11": 16857108, "2025M12": 16836383, "2026M01": 16905098, "2026M02": 16943882, "2026M03": 16861718, "2026M04": 16748162}}, "Greater China": {"CY 2024": {"2025M05": 30087168, "2025M06": 30087168, "2025M07": 30087168, "2025M08": 30087168, "2025M09": 30087168, "2025M10": 30087168, "2025M11": 30087168, "2025M12": 30087168, "2026M01": 30087168, "2026M02": 30087168, "2026M03": 30087168, "2026M04": 30087168}, "CY 2025": {"2025M05": 30706743, "2025M06": 31061388, "2025M07": 31225263, "2025M08": 31420082, "2025M09": 31809654, "2025M10": 32028789, "2025M11": 32416054, "2025M12": 32966150, "2026M01": 33139613, "2026M02": 33095001, "2026M03": 33095001, "2026M04": 33095001}, "CY 2026": {"2025M05": 30706099, "2025M06": 31095117, "2025M07": 31242743, "2025M08": 31384551, "2025M09": 31607623, "2025M10": 31708712, "2025M11": 31899334, "2025M12": 32260574, "2026M01": 32712599, "2026M02": 32696547, "2026M03": 32580618, "2026M04": 32341227}}, "Japan/Korea": {"CY 2024": {"2025M05": 11976198, "2025M06": 11976198, "2025M07": 11976198, "2025M08": 11976198, "2025M09": 11980053, "2025M10": 11980053, "2025M11": 11980053, "2025M12": 11980053, "2026M01": 11980053, "2026M02": 11980053, "2026M03": 11980053, "2026M04": 11980053}, "CY 2025": {"2025M05": 11762946, "2025M06": 11811781, "2025M07": 11870555, "2025M08": 11991796, "2025M09": 12022759, "2025M10": 12049652, "2025M11": 12080459, "2025M12": 12061069, "2026M01": 12062637, "2026M02": 12070739, "2026M03": 12070739, "2026M04": 12070739}, "CY 2026": {"2025M05": 11193470, "2025M06": 11308100, "2025M07": 11340875, "2025M08": 11343425, "2025M09": 11468132, "2025M10": 11535182, "2025M11": 11671929, "2025M12": 11836096, "2026M01": 11904289, "2026M02": 12000525, "2026M03": 11885820, "2026M04": 11820950}}, "Middle East/Africa": {"CY 2024": {"2025M05": 2239469, "2025M06": 2239469, "2025M07": 2347986, "2025M08": 2347986, "2025M09": 2347981, "2025M10": 2347981, "2025M11": 2347981, "2025M12": 2350009, "2026M01": 2350009, "2026M02": 2350009, "2026M03": 2350009, "2026M04": 2350159}, "CY 2025": {"2025M05": 2080081, "2025M06": 2091091, "2025M07": 2214251, "2025M08": 2226117, "2025M09": 2225123, "2025M10": 2281059, "2025M11": 2282632, "2025M12": 2323520, "2026M01": 2420923, "2026M02": 2425100, "2026M03": 2428434, "2026M04": 2430967}, "CY 2026": {"2025M05": 2289101, "2025M06": 2286950, "2025M07": 2347044, "2025M08": 2321957, "2025M09": 2326188, "2025M10": 2357312, "2025M11": 2304555, "2025M12": 2300607, "2026M01": 2319157, "2026M02": 2313425, "2026M03": 2077050, "2026M04": 1933775}}, "North America": {"CY 2024": {"2025M05": 15451820, "2025M06": 15451914, "2025M07": 15449571, "2025M08": 15449571, "2025M09": 15449571, "2025M10": 15449571, "2025M11": 15449571, "2025M12": 15449571, "2026M01": 15449571, "2026M02": 15449571, "2026M03": 15449571, "2026M04": 15449571}, "CY 2025": {"2025M05": 14177797, "2025M06": 14611355, "2025M07": 14851917, "2025M08": 14939022, "2025M09": 15151164, "2025M10": 15144452, "2025M11": 15166352, "2025M12": 15242585, "2026M01": 15289747, "2026M02": 15266526, "2026M03": 15265165, "2026M04": 15265165}, "CY 2026": {"2025M05": 14479295, "2025M06": 14542127, "2025M07": 14321894, "2025M08": 14324614, "2025M09": 14661235, "2025M10": 14745853, "2025M11": 14793618, "2025M12": 15081796, "2026M01": 14960335, "2026M02": 15021211, "2026M03": 15020464, "2026M04": 14957675}}, "South America": {"CY 2024": {"2025M05": 2962087, "2025M06": 2962087, "2025M07": 2962087, "2025M08": 2962087, "2025M09": 2962087, "2025M10": 2962087, "2025M11": 2962087, "2025M12": 2961973, "2026M01": 2961973, "2026M02": 2962087, "2026M03": 2962087, "2026M04": 2962087}, "CY 2025": {"2025M05": 3119817, "2025M06": 3114935, "2025M07": 3171111, "2025M08": 3185365, "2025M09": 3174353, "2025M10": 3156709, "2025M11": 3147556, "2025M12": 3023506, "2026M01": 3016273, "2026M02": 3055557, "2026M03": 3056798, "2026M04": 3056798}, "CY 2026": {"2025M05": 3238958, "2025M06": 3255198, "2025M07": 3332862, "2025M08": 3345570, "2025M09": 3301721, "2025M10": 3340274, "2025M11": 3318070, "2025M12": 3180599, "2026M01": 3204672, "2026M02": 3232994, "2026M03": 3169018, "2026M04": 3128681}}, "South Asia": {"CY 2024": {"2025M05": 9583374, "2025M06": 9583374, "2025M07": 9583374, "2025M08": 9583374, "2025M09": 9583374, "2025M10": 9590255, "2025M11": 9590255, "2025M12": 9590255, "2026M01": 9590255, "2026M02": 9590256, "2026M03": 9590256, "2026M04": 9590256}, "CY 2025": {"2025M05": 9776723, "2025M06": 9834356, "2025M07": 9844412, "2025M08": 9808613, "2025M09": 9821396, "2025M10": 9849957, "2025M11": 9876768, "2025M12": 9903863, "2026M01": 10020007, "2026M02": 10101250, "2026M03": 10101250, "2026M04": 10101250}, "CY 2026": {"2025M05": 10309447, "2025M06": 10289158, "2025M07": 10208955, "2025M08": 10180597, "2025M09": 10351752, "2025M10": 10443744, "2025M11": 10401982, "2025M12": 10452827, "2026M01": 10582595, "2026M02": 10606243, "2026M03": 10535104, "2026M04": 10447104}}}}, "latestFileData": {"globalByYear": {"CY 2021": 77193585, "CY 2022": 82338470, "CY 2023": 90486086, "CY 2024": 89588523, "CY 2025": 93067455, "CY 2026": 91377574, "CY 2027": 92781543, "CY 2028": 93930284, "CY 2029": 95743747, "CY 2030": 97165721, "CY 2031": 98434556, "CY 2032": 99659091, "CY 2033": 100851295, "CY 2034": 101768618, "CY 2035": 102313543}, "regionByYear": {"Europe": {"CY 2021": 15891353, "CY 2022": 15826861, "CY 2023": 17965801, "CY 2024": 17169229, "CY 2025": 17047535, "CY 2026": 16748162, "CY 2027": 16866869, "CY 2028": 17098483, "CY 2029": 17258619, "CY 2030": 17254055, "CY 2031": 17554141, "CY 2032": 17535530, "CY 2033": 17734307, "CY 2034": 17893552, "CY 2035": 18026120}, "Greater China": {"CY 2021": 24842717, "CY 2022": 26403262, "CY 2023": 29043480, "CY 2024": 30087168, "CY 2025": 33095001, "CY 2026": 32341227, "CY 2027": 32456083, "CY 2028": 32260503, "CY 2029": 32809290, "CY 2030": 33323331, "CY 2031": 33816723, "CY 2032": 34228974, "CY 2033": 34548653, "CY 2034": 34821209, "CY 2035": 35044542}, "Japan/Korea": {"CY 2021": 10874737, "CY 2022": 11137774, "CY 2023": 12805186, "CY 2024": 11980053, "CY 2025": 12070739, "CY 2026": 11820950, "CY 2027": 11565700, "CY 2028": 11303611, "CY 2029": 11225066, "CY 2030": 11042772, "CY 2031": 10904753, "CY 2032": 11034863, "CY 2033": 11006714, "CY 2034": 11109869, "CY 2035": 11013119}, "Middle East/Africa": {"CY 2021": 2052243, "CY 2022": 2238979, "CY 2023": 2301429, "CY 2024": 2350159, "CY 2025": 2430967, "CY 2026": 1933775, "CY 2027": 2240285, "CY 2028": 2495713, "CY 2029": 2602821, "CY 2030": 2568509, "CY 2031": 2555535, "CY 2032": 2536543, "CY 2033": 2529546, "CY 2034": 2472141, "CY 2035": 2471658}, "North America": {"CY 2021": 13047059, "CY 2022": 14296208, "CY 2023": 15682802, "CY 2024": 15449571, "CY 2025": 15265165, "CY 2026": 14957675, "CY 2027": 15301491, "CY 2028": 15459601, "CY 2029": 15857879, "CY 2030": 16210612, "CY 2031": 16278480, "CY 2032": 16412891, "CY 2033": 16499466, "CY 2034": 16363746, "CY 2035": 16100538}, "South America": {"CY 2021": 2605228, "CY 2022": 2821193, "CY 2023": 2910600, "CY 2024": 2962087, "CY 2025": 3056798, "CY 2026": 3128681, "CY 2027": 3348585, "CY 2028": 3498697, "CY 2029": 3723452, "CY 2030": 3898118, "CY 2031": 4059866, "CY 2032": 4191253, "CY 2033": 4412063, "CY 2034": 4541128, "CY 2035": 4719243}, "South Asia": {"CY 2021": 7880248, "CY 2022": 9614193, "CY 2023": 9776788, "CY 2024": 9590256, "CY 2025": 10101250, "CY 2026": 10447104, "CY 2027": 11002530, "CY 2028": 11813676, "CY 2029": 12266620, "CY 2030": 12868324, "CY 2031": 13265058, "CY 2032": 13719037, "CY 2033": 14120546, "CY 2034": 14566973, "CY 2035": 14938323}}, "bodyTypeByYear": {"Car": {"CY 2021": 27538313, "CY 2022": 28930061, "CY 2023": 30070498, "CY 2024": 28394445, "CY 2025": 28218593, "CY 2026": 25672256, "CY 2027": 25617104, "CY 2028": 25544102, "CY 2029": 26040449, "CY 2030": 26245598, "CY 2031": 26538223, "CY 2032": 26623281, "CY 2033": 26784879, "CY 2034": 26770228, "CY 2035": 26606639}, "MPV": {"CY 2021": 3939334, "CY 2022": 4171576, "CY 2023": 4760303, "CY 2024": 4598111, "CY 2025": 4977552, "CY 2026": 4943727, "CY 2027": 5047291, "CY 2028": 5078932, "CY 2029": 5223782, "CY 2030": 5431118, "CY 2031": 5460707, "CY 2032": 5501198, "CY 2033": 5521142, "CY 2034": 5631270, "CY 2035": 5659694}, "PUP": {"CY 2021": 5833498, "CY 2022": 6260582, "CY 2023": 6376283, "CY 2024": 6327002, "CY 2025": 6449459, "CY 2026": 6486961, "CY 2027": 6553426, "CY 2028": 6421346, "CY 2029": 6596184, "CY 2030": 6741611, "CY 2031": 6840856, "CY 2032": 6873203, "CY 2033": 6873592, "CY 2034": 6943999, "CY 2035": 6924826}, "SPORT": {"CY 2021": 364573, "CY 2022": 423803, "CY 2023": 477675, "CY 2024": 325656, "CY 2025": 298540, "CY 2026": 268106, "CY 2027": 273541, "CY 2028": 304145, "CY 2029": 296191, "CY 2030": 314954, "CY 2031": 316723, "CY 2032": 312707, "CY 2033": 317576, "CY 2034": 315835, "CY 2035": 310262}, "SUV": {"CY 2021": 31299427, "CY 2022": 34983012, "CY 2023": 40535209, "CY 2024": 42184640, "CY 2025": 45232057, "CY 2026": 46197241, "CY 2027": 47598805, "CY 2028": 48850628, "CY 2029": 49645763, "CY 2030": 50425484, "CY 2031": 51304353, "CY 2032": 52363437, "CY 2033": 53322793, "CY 2034": 54045013, "CY 2035": 54684542}, "Van": {"CY 2021": 8218440, "CY 2022": 7569436, "CY 2023": 8266118, "CY 2024": 7758669, "CY 2025": 7891254, "CY 2026": 7809283, "CY 2027": 7691376, "CY 2028": 7731131, "CY 2029": 7941378, "CY 2030": 8006956, "CY 2031": 7973694, "CY 2032": 7985265, "CY 2033": 8031313, "CY 2034": 8062273, "CY 2035": 8127580}}, "segmentByYear": {"A-Segment": {"CY 2021": 4223745, "CY 2022": 4773137, "CY 2023": 4414267, "CY 2024": 4352265, "CY 2025": 4765375, "CY 2026": 4238963, "CY 2027": 4289715, "CY 2028": 4389120, "CY 2029": 4473002, "CY 2030": 4515158, "CY 2031": 4641055, "CY 2032": 4629104, "CY 2033": 4702695, "CY 2034": 4776869, "CY 2035": 4756330}, "B-Segment": {"CY 2021": 14581653, "CY 2022": 15179220, "CY 2023": 15732157, "CY 2024": 15636846, "CY 2025": 16744988, "CY 2026": 16038681, "CY 2027": 16430131, "CY 2028": 17055853, "CY 2029": 17443098, "CY 2030": 17653666, "CY 2031": 17639676, "CY 2032": 18148280, "CY 2033": 18616522, "CY 2034": 18784677, "CY 2035": 19034673}, "C-Segment": {"CY 2021": 22365916, "CY 2022": 23358120, "CY 2023": 26459394, "CY 2024": 24770449, "CY 2025": 25287047, "CY 2026": 24183917, "CY 2027": 23827957, "CY 2028": 23809896, "CY 2029": 24121349, "CY 2030": 24221825, "CY 2031": 24707692, "CY 2032": 24684753, "CY 2033": 24879412, "CY 2034": 25058485, "CY 2035": 25070609}, "Compact Full-Frame": {"CY 2021": 2836028, "CY 2022": 3091614, "CY 2023": 3129444, "CY 2024": 3296795, "CY 2025": 3713402, "CY 2026": 3555678, "CY 2027": 3330852, "CY 2028": 3309909, "CY 2029": 3293941, "CY 2030": 3182818, "CY 2031": 3169446, "CY 2032": 3239800, "CY 2033": 3242519, "CY 2034": 3253773, "CY 2035": 3187734}, "D-Segment": {"CY 2021": 16200124, "CY 2022": 18849967, "CY 2023": 21796541, "CY 2024": 23171555, "CY 2025": 23363678, "CY 2026": 23417056, "CY 2027": 24216685, "CY 2028": 24533397, "CY 2029": 25263073, "CY 2030": 25866810, "CY 2031": 26300966, "CY 2032": 26658146, "CY 2033": 26944904, "CY 2034": 27171424, "CY 2035": 27552693}, "E-Segment": {"CY 2021": 7130505, "CY 2022": 7577926, "CY 2023": 9075560, "CY 2024": 9016790, "CY 2025": 9642182, "CY 2026": 10267717, "CY 2027": 10993014, "CY 2028": 11216522, "CY 2029": 11285776, "CY 2030": 11547549, "CY 2031": 11723767, "CY 2032": 12023639, "CY 2033": 12176948, "CY 2034": 12407266, "CY 2035": 12408509}, "Full-Size Full-Frame": {"CY 2021": 7441436, "CY 2022": 7232112, "CY 2023": 7631646, "CY 2024": 7455004, "CY 2025": 7448745, "CY 2026": 7683413, "CY 2027": 7813196, "CY 2028": 7782801, "CY 2029": 7989291, "CY 2030": 8286442, "CY 2031": 8393183, "CY 2032": 8386805, "CY 2033": 8394568, "CY 2034": 8381280, "CY 2035": 8345253}, "Mini Full-Frame": {"CY 2021": 2414178, "CY 2022": 2276374, "CY 2023": 2247077, "CY 2024": 1888819, "CY 2025": 2102038, "CY 2026": 1992149, "CY 2027": 1879993, "CY 2028": 1832786, "CY 2029": 1874217, "CY 2030": 1891453, "CY 2031": 1858771, "CY 2032": 1888564, "CY 2033": 1893727, "CY 2034": 1934844, "CY 2035": 1957742}}, "priceClassByYear": {"Entry": {"CY 2021": 42371469, "CY 2022": 44946602, "CY 2023": 48491330, "CY 2024": 49482229, "CY 2025": 52570526, "CY 2026": 51231969, "CY 2027": 51758676, "CY 2028": 51787161, "CY 2029": 51889131, "CY 2030": 52723086, "CY 2031": 53325689, "CY 2032": 53863635, "CY 2033": 54610786, "CY 2034": 55092231, "CY 2035": 55329715}, "Mid": {"CY 2021": 23941220, "CY 2022": 25680880, "CY 2023": 28388949, "CY 2024": 27218267, "CY 2025": 28358288, "CY 2026": 28217635, "CY 2027": 29258844, "CY 2028": 30160801, "CY 2029": 31600056, "CY 2030": 32126185, "CY 2031": 32587402, "CY 2032": 33122021, "CY 2033": 33457435, "CY 2034": 33574919, "CY 2035": 33815955}, "Others": {"CY 2021": 0, "CY 2022": 0, "CY 2023": 554, "CY 2024": 0, "CY 2025": 0, "CY 2026": 0, "CY 2027": 0, "CY 2028": 0, "CY 2029": 0, "CY 2030": 0, "CY 2031": 0, "CY 2032": 0, "CY 2033": 0, "CY 2034": 0, "CY 2035": 0}, "Premium": {"CY 2021": 10875704, "CY 2022": 11710705, "CY 2023": 13605113, "CY 2024": 12877081, "CY 2025": 12115931, "CY 2026": 11892639, "CY 2027": 11715951, "CY 2028": 11933673, "CY 2029": 12212730, "CY 2030": 12248158, "CY 2031": 12457440, "CY 2032": 12608758, "CY 2033": 12719369, "CY 2034": 13042400, "CY 2035": 13090550}, "Ultra Low": {"CY 2021": 5192, "CY 2022": 283, "CY 2023": 140, "CY 2024": 10946, "CY 2025": 22710, "CY 2026": 35331, "CY 2027": 48072, "CY 2028": 48649, "CY 2029": 41830, "CY 2030": 68292, "CY 2031": 64025, "CY 2032": 64677, "CY 2033": 63705, "CY 2034": 59068, "CY 2035": 77323}}, "assemblyByYear": {"CBU": {"CY 2021": 75331002, "CY 2022": 80451688, "CY 2023": 88630588, "CY 2024": 87636460, "CY 2025": 90886099, "CY 2026": 88826852, "CY 2027": 89654925, "CY 2028": 90319776, "CY 2029": 91923557, "CY 2030": 93499393, "CY 2031": 94629015, "CY 2032": 95918998, "CY 2033": 97087875, "CY 2034": 98039178, "CY 2035": 98601509}, "CKD": {"CY 2021": 1862583, "CY 2022": 1886782, "CY 2023": 1855498, "CY 2024": 1952063, "CY 2025": 2181356, "CY 2026": 2550722, "CY 2027": 3126618, "CY 2028": 3610508, "CY 2029": 3820190, "CY 2030": 3666328, "CY 2031": 3805541, "CY 2032": 3740093, "CY 2033": 3763420, "CY 2034": 3729440, "CY 2035": 3712034}}, "prodTypeByYear": {"PC": {"CY 2021": 63146723, "CY 2022": 68527910, "CY 2023": 75840123, "CY 2024": 75490685, "CY 2025": 78686374, "CY 2026": 77048356, "CY 2027": 78501153, "CY 2028": 79747008, "CY 2029": 81159144, "CY 2030": 82346462, "CY 2031": 83552688, "CY 2032": 84716562, "CY 2033": 85842703, "CY 2034": 86660242, "CY 2035": 87173747}, "LCV": {"CY 2021": 14046862, "CY 2022": 13810560, "CY 2023": 14645963, "CY 2024": 14097838, "CY 2025": 14381081, "CY 2026": 14329218, "CY 2027": 14280390, "CY 2028": 14183276, "CY 2029": 14584603, "CY 2030": 14819259, "CY 2031": 14881868, "CY 2032": 14942529, "CY 2033": 15008592, "CY 2034": 15108376, "CY 2035": 15139796}}, "topManufacturers": [{"name": "Toyota", "CY2024": 7985864, "CY2025": 8593452, "CY2026": 8286889, "CY2027": 8431905}, {"name": "Hyundai", "CY2024": 6550723, "CY2025": 6551589, "CY2026": 6390290, "CY2027": 6484628}, {"name": "Volkswagen", "CY2024": 5911492, "CY2025": 5952763, "CY2026": 5731374, "CY2027": 5651916}, {"name": "Stellantis", "CY2024": 5494539, "CY2025": 5816669, "CY2026": 5941726, "CY2027": 5916191}, {"name": "BYD", "CY2024": 4282541, "CY2025": 4499792, "CY2026": 4393072, "CY2027": 4654808}, {"name": "Ford", "CY2024": 3680742, "CY2025": 3628802, "CY2026": 3435217, "CY2027": 3476536}, {"name": "Geely", "CY2024": 2584420, "CY2025": 3488184, "CY2026": 3379570, "CY2027": 3420034}, {"name": "General Motors", "CY2024": 3623486, "CY2025": 3429581, "CY2026": 3297828, "CY2027": 3352611}, {"name": "Honda", "CY2024": 2872117, "CY2025": 2672521, "CY2026": 2631423, "CY2027": 2548017}, {"name": "Renault", "CY2024": 2419375, "CY2025": 2453494, "CY2026": 2378002, "CY2027": 2518810}, {"name": "Chery", "CY2024": 1778418, "CY2025": 2270018, "CY2026": 2381278, "CY2027": 2457751}, {"name": "Maruti-Suzuki", "CY2024": 2062405, "CY2025": 2257519, "CY2026": 2450414, "CY2027": 2558373}, {"name": "Nissan", "CY2024": 2211101, "CY2025": 2065953, "CY2026": 2014495, "CY2027": 2038539}, {"name": "Changan", "CY2024": 1833815, "CY2025": 1950624, "CY2026": 1653661, "CY2027": 1779585}, {"name": "BMW", "CY2024": 1787348, "CY2025": 1827435, "CY2026": 1811749, "CY2027": 1773865}, {"name": "SAIC-GM-Wuling", "CY2024": 1374571, "CY2025": 1685563, "CY2026": 1505507, "CY2027": 1296819}, {"name": "Tesla", "CY2024": 1769744, "CY2025": 1664367, "CY2026": 1582434, "CY2027": 1580832}, {"name": "FAW-VW", "CY2024": 1600777, "CY2025": 1551177, "CY2026": 1339936, "CY2027": 1118788}, {"name": "Mercedes-Benz", "CY2024": 1601172, "CY2025": 1514050, "CY2026": 1564547, "CY2027": 1579900}, {"name": "Great Wall", "CY2024": 1197919, "CY2025": 1291291, "CY2026": 1434207, "CY2027": 1470385}, {"name": "Suzuki", "CY2024": 1173417, "CY2025": 1073704, "CY2026": 1048765, "CY2027": 1064268}, {"name": "SAIC Motors", "CY2024": 842637, "CY2025": 1068148, "CY2026": 1345932, "CY2027": 1533131}, {"name": "SAIC-VW", "CY2024": 1147257, "CY2025": 1057605, "CY2026": 954622, "CY2027": 950361}, {"name": "Mahindra & Mahindra", "CY2024": 798580, "CY2025": 939607, "CY2026": 985904, "CY2027": 975027}, {"name": "Mazda", "CY2024": 949609, "CY2025": 892338, "CY2026": 819604, "CY2027": 804922}, {"name": "Tata", "CY2024": 1049113, "CY2025": 864984, "CY2026": 1007710, "CY2027": 983216}, {"name": "FAW-Toyota", "CY2024": 769722, "CY2025": 809101, "CY2026": 708790, "CY2027": 617777}, {"name": "GAC-Toyota", "CY2024": 736008, "CY2025": 756299, "CY2026": 760600, "CY2027": 690188}, {"name": "Mitsubishi", "CY2024": 746823, "CY2025": 671122, "CY2026": 665937, "CY2027": 598372}, {"name": "Volvo", "CY2024": 666936, "CY2025": 670911, "CY2026": 668693, "CY2027": 714494}], "topCountries": [{"country": "Mainland China", "region": "Greater China", "CY2024": 29817466, "CY2025": 32864860, "CY2026": 32085507}, {"country": "United States", "region": "North America", "CY2024": 10163351, "CY2025": 10078600, "CY2026": 9869585}, {"country": "Japan", "region": "Japan/Korea", "CY2024": 7898708, "CY2025": 8011101, "CY2026": 7881761}, {"country": "India", "region": "South Asia", "CY2024": 5655384, "CY2025": 6124063, "CY2026": 6489142}, {"country": "Germany", "region": "Europe", "CY2024": 4196259, "CY2025": 4245271, "CY2026": 4019934}, {"country": "South Korea", "region": "Japan/Korea", "CY2024": 4081345, "CY2025": 4059638, "CY2026": 3939189}, {"country": "Mexico", "region": "North America", "CY2024": 3991391, "CY2025": 3952633, "CY2026": 3848660}, {"country": "Brazil", "region": "South America", "CY2024": 2381299, "CY2025": 2492850, "CY2026": 2557149}, {"country": "Spain", "region": "Europe", "CY2024": 2349791, "CY2025": 2252579, "CY2026": 2152166}, {"country": "France", "region": "Europe", "CY2024": 1357418, "CY2025": 1460879, "CY2026": 1437663}, {"country": "Thailand", "region": "South Asia", "CY2024": 1460721, "CY2025": 1458840, "CY2026": 1354553}, {"country": "Czech Republic", "region": "Europe", "CY2024": 1448908, "CY2025": 1442248, "CY2026": 1357907}, {"country": "Turkey", "region": "Europe", "CY2024": 1340385, "CY2025": 1406805, "CY2026": 1267215}, {"country": "Canada", "region": "North America", "CY2024": 1294829, "CY2025": 1233932, "CY2026": 1239430}, {"country": "Iran", "region": "Middle East/Africa", "CY2024": 1144829, "CY2025": 1188557, "CY2026": 687580}, {"country": "Indonesia", "region": "South Asia", "CY2024": 1135118, "CY2025": 1098670, "CY2026": 1143218}, {"country": "Slovakia", "region": "Europe", "CY2024": 993088, "CY2025": 1073942, "CY2026": 1064778}, {"country": "Malaysia", "region": "South Asia", "CY2024": 781972, "CY2025": 756837, "CY2026": 763275}, {"country": "Russia", "region": "Europe", "CY2024": 855958, "CY2025": 748514, "CY2026": 844464}, {"country": "United Kingdom", "region": "Europe", "CY2024": 883939, "CY2025": 744542, "CY2026": 703152}, {"country": "South Africa", "region": "Middle East/Africa", "CY2024": 574095, "CY2025": 595156, "CY2026": 523873}, {"country": "Romania", "region": "Europe", "CY2024": 560102, "CY2025": 545510, "CY2026": 492706}, {"country": "Poland", "region": "Europe", "CY2024": 583782, "CY2025": 532527, "CY2026": 456125}, {"country": "Argentina", "region": "South America", "CY2024": 521358, "CY2025": 505590, "CY2026": 510694}, {"country": "Morocco", "region": "Middle East/Africa", "CY2024": 557724, "CY2025": 497780, "CY2026": 559395}], "topPlatforms": [{"platform": "MQB A/B", "manufacturer": "Volkswagen", "CY2025": 2624408}, {"platform": "GA-K", "manufacturer": "Toyota", "CY2025": 2602500}, {"platform": "N3/N4", "manufacturer": "Hyundai", "CY2025": 2449584}, {"platform": "BLP", "manufacturer": "BYD", "CY2025": 1830456}, {"platform": "GEN III", "manufacturer": "Tesla", "CY2025": 1610467}, {"platform": "B", "manufacturer": "Maruti-Suzuki", "CY2025": 1546327}, {"platform": "CMP", "manufacturer": "Stellantis", "CY2025": 1533854}, {"platform": "CMF-B", "manufacturer": "Renault", "CY2025": 1517919}, {"platform": "MQB A0", "manufacturer": "Volkswagen", "CY2025": 1498333}, {"platform": "K1/K2-P2", "manufacturer": "Hyundai", "CY2025": 1433942}, {"platform": "GA-C", "manufacturer": "Toyota", "CY2025": 1413826}, {"platform": "T1XX", "manufacturer": "General Motors", "CY2025": 1392603}, {"platform": "HA", "manufacturer": "Honda", "CY2025": 1317881}, {"platform": "BMP", "manufacturer": "BYD", "CY2025": 1310633}, {"platform": "T1X", "manufacturer": "Chery", "CY2025": 1286562}, {"platform": "BSP", "manufacturer": "BYD", "CY2025": 1237937}, {"platform": "GEA", "manufacturer": "Geely", "CY2025": 1102041}, {"platform": "VSS-F B/C", "manufacturer": "General Motors", "CY2025": 1093243}, {"platform": "MQB A/B", "manufacturer": "FAW-VW", "CY2025": 1043482}, {"platform": "GA-F", "manufacturer": "Toyota", "CY2025": 1022563}], "globalMonthly": {"Jan 2024": 7171644, "Feb 2024": 6545679, "Mar 2024": 7715691, "Apr 2024": 7373215, "May 2024": 7416629, "Jun 2024": 7319484, "Jul 2024": 6970607, "Aug 2024": 6808880, "Sep 2024": 7838243, "Oct 2024": 8401402, "Nov 2024": 8516202, "Dec 2024": 7510847, "Jan 2025": 6962247, "Feb 2025": 7098273, "Mar 2025": 8192679, "Apr 2025": 7526687, "May 2025": 7660504, "Jun 2025": 7727138, "Jul 2025": 7444265, "Aug 2025": 7065418, "Sep 2025": 8580384, "Oct 2025": 8617318, "Nov 2025": 8459828, "Dec 2025": 7732714, "Jan 2026": 6970586, "Feb 2026": 6575771, "Mar 2026": 7957550, "Apr 2026": 7400864, "May 2026": 7197241, "Jun 2026": 7888467, "Jul 2026": 7768948, "Aug 2026": 6828744, "Sep 2026": 8420745, "Oct 2026": 8339810, "Nov 2026": 8118390, "Dec 2026": 7910458, "Jan 2027": 6925953, "Feb 2027": 6827153, "Mar 2027": 8131586, "Apr 2027": 8080015, "May 2027": 7525657, "Jun 2027": 8108295, "Jul 2027": 7252675, "Aug 2027": 7045753, "Sep 2027": 8065258, "Oct 2027": 8427400, "Nov 2027": 8404060, "Dec 2027": 7987738}, "regionMonthly2025_2026": {"Europe": {"Jan 2025": 1304140, "Feb 2025": 1493925, "Mar 2025": 1567726, "Apr 2025": 1481316, "May 2025": 1490246, "Jun 2025": 1501149, "Jul 2025": 1388380, "Aug 2025": 890167, "Sep 2025": 1592723, "Oct 2025": 1515024, "Nov 2025": 1595510, "Dec 2025": 1227229, "Jan 2026": 1293087, "Feb 2026": 1480221, "Mar 2026": 1554673, "Apr 2026": 1482150, "May 2026": 1312574, "Jun 2026": 1512694, "Jul 2026": 1423270, "Aug 2026": 812532, "Sep 2026": 1611874, "Oct 2026": 1515068, "Nov 2026": 1474082, "Dec 2026": 1275937}, "Greater China": {"Jan 2025": 2343324, "Feb 2025": 1981233, "Mar 2025": 2859665, "Apr 2025": 2534751, "May 2025": 2552191, "Jun 2025": 2670757, "Jul 2025": 2506984, "Aug 2025": 2700776, "Sep 2025": 3155665, "Oct 2025": 3230111, "Nov 2025": 3361347, "Dec 2025": 3198197, "Jan 2026": 2315018, "Feb 2026": 1562799, "Mar 2026": 2609842, "Apr 2026": 2510028, "May 2026": 2478436, "Jun 2026": 2743270, "Jul 2026": 2708580, "Aug 2026": 2635973, "Sep 2026": 3096883, "Oct 2026": 3105877, "Nov 2026": 3201383, "Dec 2026": 3373138}, "Japan/Korea": {"Jan 2025": 935028, "Feb 2025": 1047274, "Mar 2025": 1052324, "Apr 2025": 1015227, "May 2025": 961581, "Jun 2025": 1042038, "Jul 2025": 1028223, "Aug 2025": 832245, "Sep 2025": 1060377, "Oct 2025": 1076434, "Nov 2025": 1001993, "Dec 2025": 1017995, "Jan 2026": 1002222, "Feb 2026": 974941, "Mar 2026": 1123721, "Apr 2026": 997923, "May 2026": 895548, "Jun 2026": 1057923, "Jul 2026": 1062039, "Aug 2026": 771585, "Sep 2026": 1002874, "Oct 2026": 970101, "Nov 2026": 984886, "Dec 2026": 977187}, "Middle East/Africa": {"Jan 2025": 196486, "Feb 2025": 227317, "Mar 2025": 243131, "Apr 2025": 158038, "May 2025": 192881, "Jun 2025": 184910, "Jul 2025": 204747, "Aug 2025": 168687, "Sep 2025": 223400, "Oct 2025": 233611, "Nov 2025": 215594, "Dec 2025": 182165, "Jan 2026": 174301, "Feb 2026": 177315, "Mar 2026": 108703, "Apr 2026": 137376, "May 2026": 130972, "Jun 2026": 154252, "Jul 2026": 174432, "Aug 2026": 116800, "Sep 2026": 200806, "Oct 2026": 183533, "Nov 2026": 182434, "Dec 2026": 192851}, "North America": {"Jan 2025": 1129800, "Feb 2025": 1257947, "Mar 2025": 1379567, "Apr 2025": 1280726, "May 2025": 1363749, "Jun 2025": 1310479, "Jul 2025": 1192649, "Aug 2025": 1382217, "Sep 2025": 1392472, "Oct 2025": 1389245, "Nov 2025": 1136661, "Dec 2025": 1049653, "Jan 2026": 1079684, "Feb 2026": 1238012, "Mar 2026": 1373921, "Apr 2026": 1239854, "May 2026": 1290565, "Jun 2026": 1281303, "Jul 2026": 1208928, "Aug 2026": 1339394, "Sep 2026": 1322604, "Oct 2026": 1375789, "Nov 2026": 1149746, "Dec 2026": 1057875}, "South America": {"Jan 2025": 205056, "Feb 2025": 255707, "Mar 2025": 226616, "Apr 2025": 269614, "May 2025": 258541, "Jun 2025": 244444, "Jul 2025": 267537, "Aug 2025": 285644, "Sep 2025": 287361, "Oct 2025": 290876, "Nov 2025": 253799, "Dec 2025": 211603, "Jan 2026": 181208, "Feb 2026": 232804, "Mar 2026": 299161, "Apr 2026": 252108, "May 2026": 260515, "Jun 2026": 277817, "Jul 2026": 284379, "Aug 2026": 281143, "Sep 2026": 292734, "Oct 2026": 297126, "Nov 2026": 271330, "Dec 2026": 198356}, "South Asia": {"Jan 2025": 848413, "Feb 2025": 834870, "Mar 2025": 863650, "Apr 2025": 787015, "May 2025": 841315, "Jun 2025": 773361, "Jul 2025": 855745, "Aug 2025": 805682, "Sep 2025": 868386, "Oct 2025": 882017, "Nov 2025": 894924, "Dec 2025": 845872, "Jan 2026": 925066, "Feb 2026": 909679, "Mar 2026": 887529, "Apr 2026": 781425, "May 2026": 828631, "Jun 2026": 861208, "Jul 2026": 907320, "Aug 2026": 871317, "Sep 2026": 892970, "Oct 2026": 892316, "Nov 2026": 854529, "Dec 2026": 835114}}, "regionBodyTypeCY2025": {"Europe": {"Car": 5678403, "MPV": 187187, "PUP": 6902, "SPORT": 122310, "SUV": 8472135, "Van": 2580598}, "Greater China": {"Car": 12280949, "MPV": 1102796, "PUP": 582977, "SPORT": 2702, "SUV": 16223564, "Van": 2902013}, "Japan/Korea": {"Car": 2456240, "MPV": 2011864, "PUP": 54937, "SPORT": 78895, "SUV": 6374583, "Van": 1094220}, "Middle East/Africa": {"Car": 1618136, "MPV": 4210, "PUP": 394559, "SPORT": 0, "SUV": 327185, "Van": 86877}, "North America": {"Car": 2392031, "MPV": 377504, "PUP": 3631322, "SPORT": 94633, "SUV": 8374480, "Van": 395195}, "South America": {"Car": 1009002, "MPV": 27808, "PUP": 712279, "SPORT": 0, "SUV": 1195491, "Van": 112218}, "South Asia": {"Car": 2783832, "MPV": 1266183, "PUP": 1066483, "SPORT": 0, "SUV": 4264619, "Van": 720133}}}};

/* ── PALETTE & TABS ────────────────────────────────────────── */
const P = ["#185FA5","#0F6E56","#BA7517","#993556","#534AB7","#993C1D","#3B6D11","#A32D2D"];
const REGION_COLORS = {
  "Greater China":"#D4537E","Europe":"#185FA5","North America":"#0F6E56",
  "Japan/Korea":"#BA7517","South Asia":"#534AB7","South America":"#993C1D","Middle East/Africa":"#3B6D11"
};
const TABS = [
  { id:"overview",   label:"Overview"       },
  { id:"revisions",  label:"Revisions"      },
  { id:"oems",       label:"Manufacturers"  },
  { id:"regions",    label:"Regions"        },
  { id:"segments",   label:"Segments"       },
  { id:"ai",         label:"AI Assistant"   },
];

/* ── PRE-COMPUTED CHART DATA ───────────────────────────────── */
const CY = ["CY 2021","CY 2022","CY 2023","CY 2024","CY 2025","CY 2026","CY 2027","CY 2028","CY 2029","CY 2030"];
const REGIONS = ["Greater China","Europe","North America","Japan/Korea","South Asia","South America","Middle East/Africa"];
const YR = "CY 2026";
const YR_FC = "CY 2027";
const YR_PRIOR = "CY 2025";

const regionBar = REGIONS.map(r => ({
  name: r.replace("/","/\u200b"), value: D.latestFileData.regionByYear[r][YR]
}));

const bodyPie = Object.entries(D.latestFileData.bodyTypeByYear)
  .map(([n,y])=>({ name:n, value:y[YR] }))
  .sort((a,b)=>b.value-a.value);

const revLine = D.metadata.files.map(f=>({
  file: f.tag,
  [YR]: D.revisions.global[YR][f.tag],
  [YR_FC]: D.revisions.global[YR_FC][f.tag],
}));

const regionRevTable = REGIONS.map(r=>{
  const first = D.revisions.byRegion[r]?.[YR]?.["2025M05"] || 0;
  const last  = D.revisions.byRegion[r]?.[YR]?.["2026M04"] || 0;
  const pct   = first ? ((last-first)/first*100).toFixed(1) : "—";
  return { region:r, first, last, change: pct };
}).sort((a,b)=>parseFloat(b.change)-parseFloat(a.change));

const regionTrend = CY.map(yr=>{
  const row = { year: yr.replace("CY ","") };
  REGIONS.forEach(r=>{ row[r] = D.latestFileData.regionByYear[r]?.[yr]||0; });
  return row;
});

const monthly26 = Object.entries(D.latestFileData.globalMonthly)
  .filter(([k])=>k.includes("2026"))
  .map(([k,v])=>({ month:k.replace(" 2026",""), value:v }));

const monthly27 = Object.entries(D.latestFileData.globalMonthly)
  .filter(([k])=>k.includes("2027"))
  .map(([k,v])=>({ month:k.replace(" 2027",""), value:v }));

const regionMon26 = ["Jan 2026","Feb 2026","Mar 2026","Apr 2026","May 2026","Jun 2026",
  "Jul 2026","Aug 2026","Sep 2026","Oct 2026","Nov 2026","Dec 2026"].map(m=>{
  const row = { month: m.replace(" 2026","") };
  REGIONS.forEach(r=>{ row[r] = D.latestFileData.regionMonthly2025_2026[r]?.[m]||0; });
  return row;
});

const topOEMs = D.latestFileData.topManufacturers.slice(0,15)
  .map(m=>({ name:m.name, CY2026:m.CY2026, CY2027:m.CY2027, CY2025:m.CY2025 }));

const bodyTrend = CY.map(yr=>({
  year: yr.replace("CY ",""),
  SUV:  D.latestFileData.bodyTypeByYear.SUV[yr],
  Car:  D.latestFileData.bodyTypeByYear.Car[yr],
  Van:  D.latestFileData.bodyTypeByYear.Van[yr],
  PUP:  D.latestFileData.bodyTypeByYear.PUP[yr],
  MPV:  D.latestFileData.bodyTypeByYear.MPV[yr],
}));

const priceBar = Object.entries(D.latestFileData.priceClassByYear)
  .filter(([k])=>k!=="Others" && k!=="Ultra Low")
  .map(([n,y])=>({ name:n, value:y[YR] }))
  .sort((a,b)=>b.value-a.value);

const pcLcv = CY.map(yr=>({
  year: yr.replace("CY ",""),
  PC:  D.latestFileData.prodTypeByYear.PC[yr],
  LCV: D.latestFileData.prodTypeByYear.LCV[yr],
}));

const segBar = Object.entries(D.latestFileData.segmentByYear)
  .map(([n,y])=>({ name:n.replace(" Full-Frame","FF"), value:y[YR] }))
  .sort((a,b)=>b.value-a.value);

const regionCompare = REGIONS.map(r=>({
  name: r.replace("/","/\u200b"),
  [YR]: D.latestFileData.regionByYear[r][YR],
  [YR_FC]: D.latestFileData.regionByYear[r][YR_FC],
}));

/* ── KPIs ──────────────────────────────────────────────────── */
const cy26    = D.latestFileData.globalByYear[YR];
const cy27    = D.latestFileData.globalByYear[YR_FC];
const cy25    = D.latestFileData.globalByYear[YR_PRIOR];
const firstRev = D.revisions.global[YR]["2025M05"];
const latestRev = D.revisions.global[YR]["2026M04"];
const suvShare = (D.latestFileData.bodyTypeByYear.SUV[YR]/cy26*100).toFixed(1);
const cnShare  = (D.latestFileData.regionByYear["Greater China"][YR]/cy26*100).toFixed(1);
const revPct   = ((latestRev-firstRev)/firstRev*100).toFixed(1);
const fcPct    = ((cy27-cy26)/cy26*100).toFixed(1);

/* ── SYSTEM PROMPT ─────────────────────────────────────────── */
const SYSTEM = `You are an expert IHS Markit Light Vehicle Production forecast analyst with access to 12 consecutive monthly releases from May 2025 to April 2026.

CRITICAL UNIT: ALL volumes are in VEHICLES (whole units, NOT thousands). Format with commas always.

FILE RELEASES:
  2025M05 → Jun-03-2025 → 8,704 programs
  2025M06 → Jul-03-2025 → 8,745 programs
  2025M07 → Aug-04-2025 → 8,730 programs
  2025M08 → Sep-04-2025 → 8,738 programs
  2025M09 → Oct-07-2025 → 8,770 programs
  2025M10 → Nov-04-2025 → 8,784 programs
  2025M11 → Dec-04-2025 → 8,602 programs
  2025M12 → Jan-05-2026 → 8,666 programs
  2026M01 → Feb-04-2026 → 8,708 programs
  2026M02 → Mar-05-2026 → 8,738 programs
  2026M03 → Apr-03-2026 → 8,830 programs
  2026M04 → May-12-2026 → 8,894 programs

DIMENSIONS: Regions (7): Europe, Greater China, Japan/Korea, Middle East/Africa, North America, South America, South Asia | Production Types: PC, LCV | Body Types: SUV, Car, Van, PUP, MPV, SPORT | Segments: A–E Segment, Full-Frame variants | Price Classes: Entry, Mid, Premium, Ultra Low | Assembly: CBU, CKD

COMPLETE DATASET:
${JSON.stringify(D)}

DEFAULT YEARS: Unless the user asks otherwise, focus on CY 2026 (current forecast) and CY 2027 (forward outlook). Use CY 2026→CY 2027 comparisons instead of older years like CY 2024/CY 2025.

RULES:
1. Always cite the file (e.g. "2026M04 (latest)")
2. All volumes with commas: 93,067,455
3. Percentages to 1 decimal
4. Put narrative text BEFORE or AFTER charts — never mix chart JSON inside prose. One blank line between sections.
5. CHARTS — wrap each in these exact delimiters:
   <<<CHART>>>
   {"type":"bar|line|pie|table","title":"…","data":[…],"xKey":"…","yKey":"…","unit":"units"}
   <<<ENDCHART>>>
   Schemas: bar→data=[{name,value}] | line→data=[{period,S1,S2}],lines=["S1","S2"] | pie→data=[{name,value}] | table→headers=[],rows=[[]]
6. Multiple charts per response allowed
7. Only use numbers from the embedded dataset — no guessing`;

/* ── HELPERS ───────────────────────────────────────────────── */
const yFmt = v => v>=1e6?(v/1e6).toFixed(1)+"M":v>=1e3?Math.round(v/1e3)+"K":String(v);
const comma = v => typeof v==="number"?v.toLocaleString():v;
const pctChange = (a,b) => ((b-a)/a*100).toFixed(1);

function parseAI(text){
  const parts=[]; const re=/<<<CHART>>>([\s\S]*?)<<<ENDCHART>>>/g;
  let cur=0,m;
  while((m=re.exec(text))!==null){
    const pre=text.slice(cur,m.index).trim(); if(pre)parts.push({k:"text",v:pre});
    try{parts.push({k:"chart",v:JSON.parse(m[1].trim())});}catch{parts.push({k:"text",v:m[0]});}
    cur=re.lastIndex;
  }
  const tail=text.slice(cur).trim(); if(tail)parts.push({k:"text",v:tail});
  return parts;
}

function AIText({ text }){
  const blocks = text.split(/\n{2,}/);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {blocks.map((block,bi)=>(
        <p key={bi} style={{fontSize:13,lineHeight:1.75,color:"var(--color-text-primary)",margin:0,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
          {block.split(/(\*\*[^*]+\*\*)/g).map((bit,ii)=>
            bit.startsWith("**")&&bit.endsWith("**")
              ? <strong key={ii} style={{fontWeight:600}}>{bit.slice(2,-2)}</strong>
              : bit
          )}
        </p>
      ))}
    </div>
  );
}

/* ── SHARED CHART ──────────────────────────────────────────── */
const AX={fontSize:11}; const GRID={strokeDasharray:"3 3",vertical:false,stroke:"var(--color-border-tertiary)"};
const MAR={top:5,right:20,left:8,bottom:70};
const tip=(unit)=>(v,n)=>[Number(v).toLocaleString()+(unit?" "+unit:""),n];

function RC({ cfg, tall }){
  if(!cfg) return null;
  const{type,title,data=[],xKey="name",yKey="value",lines,headers,rows,unit="units",colors}=cfg;
  const palette=colors||P;
  const barH = tall || Math.max(300, 90 + data.length * 30);
  const wrap=inner=>(
    <div style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"14px 16px",margin:"4px 0",position:"relative",isolation:"isolate",overflow:"hidden"}}>
      {title&&<p style={{fontSize:13,fontWeight:500,margin:"0 0 12px",color:"var(--color-text-primary)",lineHeight:1.4}}>{title}</p>}
      {inner}
    </div>
  );
  if(type==="bar") return wrap(
    <ResponsiveContainer width="100%" height={barH}>
      <BarChart data={data} margin={{...MAR,bottom:data.length>8?90:70}}>
        <CartesianGrid {...GRID}/>
        <XAxis dataKey={xKey} tick={AX} angle={-38} textAnchor="end" interval={0} height={data.length>8?70:50}/>
        <YAxis tickFormatter={yFmt} tick={AX} width={54}/>
        <Tooltip formatter={tip(unit)}/>
        <Bar dataKey={yKey} radius={[4,4,0,0]}>
          {data.map((_,i)=><Cell key={i} fill={palette[i%palette.length]}/>)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
  if(type==="line"){
    const keys=lines||[yKey];
    return wrap(
      <ResponsiveContainer width="100%" height={270}>
        <LineChart data={data} margin={{...MAR,bottom:50}}>
          <CartesianGrid {...GRID}/>
          <XAxis dataKey={xKey} tick={AX} angle={-38} textAnchor="end" interval={0}/>
          <YAxis tickFormatter={yFmt} tick={AX} width={54}/>
          <Tooltip formatter={tip(unit)}/>
          <Legend wrapperStyle={{fontSize:11,paddingTop:4}}/>
          {keys.map((k,i)=><Line key={k} type="monotone" dataKey={k} stroke={palette[i%palette.length]} strokeWidth={2} dot={false}/>)}
        </LineChart>
      </ResponsiveContainer>
    );
  }
  if(type==="pie") return wrap(
    <ResponsiveContainer width="100%" height={270}>
      <PieChart>
        <Pie data={data} cx="50%" cy="46%" outerRadius={95} dataKey="value"
          label={({name,percent})=>`${name}: ${(percent*100).toFixed(1)}%`} labelLine={false}>
          {data.map((_,i)=><Cell key={i} fill={palette[i%palette.length]}/>)}
        </Pie>
        <Tooltip formatter={v=>[Number(v).toLocaleString()+" "+unit,"Volume"]}/>
        <Legend wrapperStyle={{fontSize:11}}/>
      </PieChart>
    </ResponsiveContainer>
  );
  if(type==="table"&&headers&&rows) return wrap(
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr>{headers.map((h,i)=>(
          <th key={i} style={{padding:"5px 8px",borderBottom:"1px solid var(--color-border-secondary)",textAlign:i>0?"right":"left",color:"var(--color-text-secondary)",fontWeight:500}}>{h}</th>
        ))}</tr></thead>
        <tbody>{rows.map((row,ri)=>(
          <tr key={ri} style={{borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
            {row.map((cell,ci)=>(
              <td key={ci} style={{padding:"5px 8px",textAlign:ci>0?"right":"left",color:"var(--color-text-primary)"}}>
                {typeof cell==="number"?cell.toLocaleString():cell}
              </td>
            ))}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
  return null;
}

/* ── KPI CARD ──────────────────────────────────────────────── */
function Kpi({label,value,badge,badgePos,sub}){
  const pos = badgePos==null ? true : badgePos;
  return(
    <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-md)",padding:"14px 16px",minWidth:0}}>
      <p style={{fontSize:11,fontWeight:500,color:"var(--color-text-tertiary)",margin:"0 0 6px",letterSpacing:".04em"}}>{label}</p>
      <p style={{fontSize:22,fontWeight:600,margin:"0 0 6px",color:"var(--color-text-primary)",letterSpacing:"-.02em",lineHeight:1}}>{value}</p>
      {badge&&<span style={{fontSize:11,padding:"2px 7px",borderRadius:"var(--border-radius-md)",background:pos?"var(--color-background-success)":"var(--color-background-danger)",color:pos?"var(--color-text-success)":"var(--color-text-danger)",fontWeight:500}}>{badge}</span>}
      {sub&&<p style={{fontSize:11,color:"var(--color-text-secondary)",margin:"5px 0 0"}}>{sub}</p>}
    </div>
  );
}

/* ── SECTION HEADER ────────────────────────────────────────── */
function Sh({title,sub}){
  return(
    <div style={{marginBottom:14}}>
      <p style={{fontSize:14,fontWeight:600,margin:0,color:"var(--color-text-primary)"}}>{title}</p>
      {sub&&<p style={{fontSize:12,margin:"2px 0 0",color:"var(--color-text-secondary)"}}>{sub}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TAB: OVERVIEW
══════════════════════════════════════════════════════ */
function OverviewTab(){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Sh title="Global production overview" sub="Based on 2026M04 — latest IHS release (May 12, 2026)"/>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <Kpi label="GLOBAL CY 2026" value={(cy26/1e6).toFixed(2)+"M"} badge={`+${fcPct}% vs CY 2027 fc`} badgePos={parseFloat(fcPct)>=0} sub="Total vehicle units"/>
        <Kpi label="CY 2026 REVISION" value={`${parseFloat(revPct)>=0?"+":""}${revPct}%`} badgePos={parseFloat(revPct)>=0} badge="Over 12 months" sub={`${(firstRev/1e6).toFixed(1)}M → ${(latestRev/1e6).toFixed(1)}M`}/>
        <Kpi label="SUV SHARE" value={suvShare+"%"} badge="Dominant body type" badgePos={true} sub={`${(D.latestFileData.bodyTypeByYear.SUV[YR]/1e6).toFixed(1)}M units (CY 2026)`}/>
        <Kpi label="GREATER CHINA SHARE" value={cnShare+"%"} badge="Largest region" badgePos={true} sub={`${(D.latestFileData.regionByYear["Greater China"][YR]/1e6).toFixed(1)}M units (CY 2026)`}/>
      </div>
      {/* Charts row 1 */}
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:12}}>
        <RC cfg={{type:"bar",title:"CY 2026 production by region (2026M04)",data:regionBar,xKey:"name",yKey:"value",unit:"units",colors:Object.values(REGION_COLORS)}}/>
        <RC cfg={{type:"pie",title:"Body type mix — CY 2026",data:bodyPie,unit:"units"}}/>
      </div>
      {/* Charts row 2 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <RC cfg={{type:"bar",title:"Top 10 manufacturers — CY 2026",data:topOEMs.slice(0,10).map(m=>({name:m.name,value:m.CY2026})),xKey:"name",yKey:"value",unit:"units"}}/>
        <RC cfg={{type:"line",title:"Monthly global production — 2026 vs 2027 forecast",data:monthly26.map((m,i)=>({month:m.month,Y2026:m.value,Y2027:monthly27[i]?.value||0})),xKey:"month",lines:["Y2026","Y2027"],unit:"units"}}/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TAB: REVISIONS
══════════════════════════════════════════════════════ */
function RevisionsTab(){
  const tableRows = D.metadata.files.map(f=>([
    f.tag, f.pubDate,
    D.revisions.global[YR][f.tag],
    D.revisions.global[YR_FC][f.tag],
    D.revisions.global[YR_PRIOR][f.tag],
  ]));
  const regionRevBar = regionRevTable.map(r=>({
    name: r.region.replace("/","/\u200b"),
    change: parseFloat(r.change)
  }));
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Sh title="Forecast revision analysis" sub={`CY 2026 global forecast revised from ${(firstRev/1e6).toFixed(2)}M → ${(latestRev/1e6).toFixed(2)}M (${parseFloat(revPct)>=0?"+":""}${revPct}%) over 12 monthly releases`}/>
      <RC cfg={{type:"line",title:"CY 2026 & CY 2027 global forecast revision across 12 releases",data:revLine,xKey:"file",lines:[YR,YR_FC],unit:"units"}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <RC cfg={{type:"bar",title:"CY 2026 regional revision: May 2025 → Apr 2026 (%)",data:regionRevBar,xKey:"name",yKey:"change",unit:"%"}}/>
        <RC cfg={{type:"table",title:"Regional CY 2026 revision detail",
          headers:["Region","First (2025M05)","Latest (2026M04)","Change %"],
          rows:regionRevTable.map(r=>[r.region,r.first,r.last,r.change+"%"])
        }}/>
      </div>
      <RC cfg={{type:"table",title:"Full revision history — global totals by release",
        headers:["File","Published","CY 2026","CY 2027","CY 2025"],
        rows:tableRows
      }}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TAB: MANUFACTURERS
══════════════════════════════════════════════════════ */
function OEMsTab(){
  const tableRows = D.latestFileData.topManufacturers.map(m=>[
    m.name,
    m.CY2026,
    m.CY2027,
    m.CY2025,
    pctChange(m.CY2026,m.CY2027)+"%",
  ]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Sh title="Manufacturer production volumes" sub="Top 30 OEMs ranked by CY 2026 volume — 2026M04 (latest release)"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <RC cfg={{type:"bar",title:"Top 15 manufacturers — CY 2026 (units)",data:topOEMs.slice(0,15).map(m=>({name:m.name,value:m.CY2026})),xKey:"name",yKey:"value",unit:"units"}}/>
        <RC cfg={{type:"bar",title:"CY 2027 forecast — top 15 manufacturers",data:topOEMs.slice(0,15).map(m=>({name:m.name,value:m.CY2027})),xKey:"name",yKey:"value",unit:"units"}}/>
      </div>
      <RC cfg={{type:"table",title:"Top 30 manufacturers — full detail",
        headers:["Manufacturer","CY 2026","CY 2027","CY 2025","YoY 26→27"],
        rows:tableRows
      }}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TAB: REGIONS
══════════════════════════════════════════════════════ */
function RegionsTab(){
  const countryRows = D.latestFileData.topCountries.map(c=>[
    c.country, c.region, c.CY2025, c.CY2026,
    pctChange(c.CY2025,c.CY2026)+"%"
  ]);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Sh title="Regional production analysis" sub="Annual trends 2021–2030 and monthly 2026 breakdown — 2026M04 (latest)"/>
      <RC cfg={{type:"line",title:"Regional production trends — CY 2021 to CY 2030",
        data:regionTrend,xKey:"year",
        lines:REGIONS,
        colors:Object.values(REGION_COLORS),unit:"units"}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <RC cfg={{type:"line",title:"Monthly production by region — 2026",
          data:regionMon26,xKey:"month",
          lines:REGIONS,
          colors:Object.values(REGION_COLORS),unit:"units"}}/>
        <RC cfg={{type:"line",title:"CY 2026 vs CY 2027 forecast by region",
          data:regionCompare,xKey:"name",
          lines:[YR,YR_FC],
          colors:[P[0],P[1]],unit:"units"}}/>
      </div>
      <RC cfg={{type:"table",title:"Top 25 countries — CY 2025 to CY 2026",
        headers:["Country","Region","CY 2025","CY 2026","YoY 25→26"],
        rows:countryRows
      }}/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TAB: SEGMENTS
══════════════════════════════════════════════════════ */
function SegmentsTab(){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <Sh title="Segment & vehicle type analysis" sub="Body type trends, segments, price classes and production types — 2026M04 (latest)"/>
      <RC cfg={{type:"line",title:"Body type production trends — CY 2021 to CY 2030",
        data:bodyTrend,xKey:"year",lines:["SUV","Car","Van","PUP","MPV"],unit:"units"}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <RC cfg={{type:"bar",title:"Vehicle segments — CY 2026 volume",data:segBar,xKey:"name",yKey:"value",unit:"units"}}/>
        <RC cfg={{type:"pie",title:"Price class mix — CY 2026",data:priceBar,unit:"units"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <RC cfg={{type:"line",title:"PC vs LCV production — CY 2021 to CY 2030",
          data:pcLcv,xKey:"year",lines:["PC","LCV"],unit:"units"}}/>
        <RC cfg={{type:"table",title:"Body type × region — CY 2025 (latest regional split)",
          headers:["Region","SUV","Car","Van","PUP","MPV"],
          rows:REGIONS.map(r=>{
            const bt=D.latestFileData.regionBodyTypeCY2025[r]||{};
            return[r,bt.SUV||0,bt.Car||0,bt.Van||0,bt.PUP||0,bt.MPV||0];
          })
        }}/>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TAB: AI CHAT
══════════════════════════════════════════════════════ */
const CHIPS=[
  "How has the CY 2026 global forecast been revised across all 12 monthly releases?",
  "Which manufacturer had the biggest percentage gain CY 2026 to CY 2027?",
  "What is driving the Greater China CY 2026 vs CY 2027 outlook?",
  "Compare North America CY 2026 vs CY 2027 forecast by body type.",
  "Which segment is growing fastest between CY 2026 and CY 2030?",
  "Show a table of the top 10 countries by CY 2026 volume.",
];

function AIChatTab(){
  const[msgs,setMsgs]=useState([]);
  const[input,setInput]=useState("");
  const[busy,setBusy]=useState(false);
  const[dot,setDot]=useState("");
  const[conversationId,setConversationId]=useState(null);
  const[history,setHistory]=useState([]);
  const[historyOpen,setHistoryOpen]=useState(true);
  const bottomRef=useRef(null);
  const taRef=useRef(null);

  const loadHistory=useCallback(async()=>{
    try{
      const list=await fetchConversations();
      setHistory(list);
    }catch{/* optional */}
  },[]);

  useEffect(()=>{ loadHistory(); },[loadHistory]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs,busy]);
  useEffect(()=>{
    if(!busy){setDot("");return;}
    const iv=setInterval(()=>setDot(d=>d.length>=3?"":d+"."),420);
    return()=>clearInterval(iv);
  },[busy]);

  const startNewChat=useCallback(()=>{
    setConversationId(null);
    setMsgs([]);
    setInput("");
  },[]);

  const openConversation=useCallback(async(id)=>{
    if(busy||id===conversationId)return;
    try{
      const conv=await fetchConversation(id);
      setConversationId(conv.id);
      setMsgs(conv.messages||[]);
      setInput("");
    }catch{
      setMsgs([{role:"assistant",content:"⚠ Could not load that conversation."}]);
    }
  },[busy,conversationId]);

  const removeConversation=useCallback(async(e,id)=>{
    e.stopPropagation();
    try{
      await deleteConversation(id);
      if(conversationId===id) startNewChat();
      await loadHistory();
    }catch{/* ignore */}
  },[conversationId,startNewChat,loadHistory]);

  const send=useCallback(async(override)=>{
    const q=(override??input).trim(); if(!q||busy)return;
    const next=[...msgs,{role:"user",content:q}];
    setMsgs(next); setInput(""); setBusy(true);
    if(taRef.current)taRef.current.style.height="auto";
    try{
      const res=await apiFetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          system:SYSTEM,
          messages:next,
          clientId:getClientId(),
          conversationId,
        }),
      });
      const data=await res.json();
      let reply;
      if(res.status===401){
        reply="⚠ Access denied. Refresh the page and enter the team password.";
      }else if(!res.ok||data.error){
        reply="API Error: "+(data.error?.message||res.statusText||"Request failed");
      }else{
        reply=data.choices?.[0]?.message?.content||"No response from API.";
        if(data.conversationId) setConversationId(data.conversationId);
        loadHistory();
      }
      setMsgs(prev=>[...prev,{role:"assistant",content:reply}]);
    }catch(e){
      setMsgs(prev=>[...prev,{role:"assistant",content:"⚠ Error: "+e.message+". Is the server running? (npm run dev)"}]);
    }finally{setBusy(false);}
  },[msgs,input,busy,conversationId,loadHistory]);

  return(
    <div style={{display:"flex",height:"100%",minHeight:0,gap:0}}>
      {historyOpen&&(
        <aside style={{width:200,flexShrink:0,borderRight:"0.5px solid var(--color-border-tertiary)",display:"flex",flexDirection:"column",background:"var(--color-background-secondary)"}}>
          <div style={{padding:"10px 10px 8px",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
            <button onClick={startNewChat} disabled={busy}
              style={{width:"100%",padding:"7px 10px",fontSize:12,cursor:busy?"default":"pointer",borderRadius:"var(--border-radius-md)",fontWeight:500}}>
              + New chat
            </button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"6px 6px 10px"}}>
            {history.length===0&&(
              <p style={{fontSize:11,color:"var(--color-text-tertiary)",margin:"8px 6px",lineHeight:1.4}}>
                Past chats appear here and are saved on the server.
              </p>
            )}
            {history.map(c=>(
              <div key={c.id} onClick={()=>openConversation(c.id)}
                style={{
                  padding:"8px",marginBottom:4,borderRadius:"var(--border-radius-md)",cursor:"pointer",
                  background:conversationId===c.id?"var(--color-background-info)":"transparent",
                  border:conversationId===c.id?"0.5px solid var(--color-border-info)":"0.5px solid transparent",
                }}>
                <p style={{fontSize:11,fontWeight:500,margin:0,color:"var(--color-text-primary)",lineHeight:1.35,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{c.title}</p>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
                  <span style={{fontSize:9,color:"var(--color-text-tertiary)"}}>
                    {c.updatedAt?new Date(c.updatedAt).toLocaleDateString():""}
                  </span>
                  <button onClick={e=>removeConversation(e,c.id)} title="Delete"
                    style={{fontSize:10,padding:"0 4px",cursor:"pointer",background:"transparent",border:"none",color:"var(--color-text-tertiary)"}}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
      <div style={{display:"flex",flexDirection:"column",flex:1,minWidth:0,minHeight:0,gap:0}}>
        <div style={{padding:"6px 10px",borderBottom:"0.5px solid var(--color-border-tertiary)",display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setHistoryOpen(o=>!o)} style={{fontSize:11,padding:"4px 8px",cursor:"pointer",borderRadius:"var(--border-radius-md)"}}>
            {historyOpen?"◀ Hide":"▶ History"}
          </button>
          <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>
            {conversationId?"Saved conversation":"New conversation — saved after first reply"}
          </span>
        </div>
      {msgs.length===0&&(
        <div style={{marginBottom:14,padding:"0 10px"}}>
          <p style={{fontSize:12,color:"var(--color-text-secondary)",margin:"8px 0"}}>Suggested queries (CY 2026 / CY 2027 forecast):</p>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {CHIPS.map((c,i)=>(
              <button key={i} onClick={()=>send(c)} style={{textAlign:"left",padding:"8px 12px",cursor:"pointer",borderRadius:"var(--border-radius-md)",fontSize:12,lineHeight:1.5,color:"var(--color-text-primary)",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-tertiary)"}}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{flex:1,overflowY:"auto",paddingRight:4,minHeight:0,padding:"0 10px"}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{marginBottom:20,display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            {m.role==="user"?(
              <div style={{maxWidth:"72%",padding:"9px 13px",borderRadius:"var(--border-radius-lg)",background:"var(--color-background-info)",border:"0.5px solid var(--color-border-info)",fontSize:13,lineHeight:1.6,color:"var(--color-text-primary)",whiteSpace:"pre-wrap"}}>{m.content}</div>
            ):(
              <div style={{width:"100%",maxWidth:"100%",display:"flex",flexDirection:"column",gap:14}}>
                <p style={{fontSize:10,fontWeight:500,margin:0,color:"var(--color-text-tertiary)",letterSpacing:".06em"}}>IHS ANALYST</p>
                {parseAI(m.content).map((p,j)=>
                  p.k==="chart"
                    ?<div key={j} style={{width:"100%"}}><RC cfg={p.v} tall={p.v?.data?.length>10?Math.max(340,p.v.data.length*32):undefined}/></div>
                    :<AIText key={j} text={p.v}/>
                )}
              </div>
            )}
          </div>
        ))}
        {busy&&(
          <div style={{marginBottom:14}}>
            <p style={{fontSize:10,fontWeight:500,margin:"0 0 5px",color:"var(--color-text-tertiary)",letterSpacing:".06em"}}>IHS ANALYST</p>
            <div style={{display:"inline-block",padding:"8px 13px",background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",fontSize:12,color:"var(--color-text-secondary)"}}>Analyzing{dot}</div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      <div style={{padding:"10px 10px 0",borderTop:"0.5px solid var(--color-border-tertiary)",marginTop:10}}>
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <textarea ref={taRef} value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,100)+"px";}}
            placeholder="Ask about volumes, revisions, OEMs, regions, segments…" rows={1}
            style={{flex:1,resize:"none",fontSize:13,padding:"8px 11px",borderRadius:"var(--border-radius-md)",overflow:"hidden",lineHeight:1.5}}/>
          <button onClick={()=>send()} disabled={!input.trim()||busy}
            style={{flexShrink:0,padding:"8px 16px",borderRadius:"var(--border-radius-md)",fontSize:13,cursor:input.trim()&&!busy?"pointer":"default",opacity:!input.trim()||busy?0.4:1}}>
            Send ↗
          </button>
        </div>
        <p style={{margin:"4px 0 0",fontSize:10,color:"var(--color-text-tertiary)"}}>Enter to send · Shift+Enter for new line · Chats saved per browser</p>
      </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ACCESS GATE (optional team password when deployed)
══════════════════════════════════════════════════════ */
function AccessGate({ children }){
  const[checking,setChecking]=useState(true);
  const[required,setRequired]=useState(false);
  const[unlocked,setUnlocked]=useState(false);
  const[password,setPassword]=useState("");
  const[error,setError]=useState("");

  useEffect(()=>{
    fetchAuthConfig().then(cfg=>{
      setRequired(cfg.required);
      setUnlocked(!cfg.required||!!getStoredAccessKey());
      setChecking(false);
    }).catch(()=>setChecking(false));
  },[]);

  const submit=async(e)=>{
    e.preventDefault();
    const key=password.trim();
    if(!key)return;
    setStoredAccessKey(key);
    const res=await fetch("/api/health",{headers:{"x-access-key":key}});
    if(res.ok){setUnlocked(true);setError("");}
    else{setStoredAccessKey("");setError("Incorrect team password.");}
  };

  if(checking){
    return(
      <div style={{padding:48,textAlign:"center",color:"var(--color-text-secondary)",fontSize:14}}>
        Loading…
      </div>
    );
  }

  if(required&&!unlocked){
    return(
      <div style={{maxWidth:360,margin:"80px auto",padding:24,border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",background:"var(--color-background-primary)"}}>
        <p style={{fontSize:16,fontWeight:600,margin:"0 0 6px",color:"var(--color-text-primary)"}}>IHS LV Production Analytics</p>
        <p style={{fontSize:13,margin:"0 0 16px",color:"var(--color-text-secondary)",lineHeight:1.5}}>
          Enter the team password to access this app.
        </p>
        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:10}}>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Team password"
            style={{fontSize:14,padding:"10px 12px",borderRadius:"var(--border-radius-md)"}} autoFocus/>
          {error&&<p style={{margin:0,fontSize:12,color:"var(--color-text-danger)"}}>{error}</p>}
          <button type="submit" style={{padding:"10px 14px",borderRadius:"var(--border-radius-md)",fontSize:14,cursor:"pointer"}}>
            Continue
          </button>
        </form>
      </div>
    );
  }

  return children;
}

/* ══════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════ */
export default function App(){
  const[tab,setTab]=useState("overview");
  const latest=D.metadata.files.at(-1);

  const content={
    overview:    <OverviewTab/>,
    revisions:   <RevisionsTab/>,
    oems:        <OEMsTab/>,
    regions:     <RegionsTab/>,
    segments:    <SegmentsTab/>,
    ai:          <AIChatTab/>,
  };

  return(
    <AccessGate>
    <div style={{display:"flex",flexDirection:"column",minHeight:820,border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",overflow:"hidden",background:"var(--color-background-primary)"}}>

      {/* ── TOP HEADER ── */}
      <div style={{flexShrink:0,padding:"12px 18px",background:"var(--color-background-secondary)",borderBottom:"0.5px solid var(--color-border-tertiary)",display:"flex",alignItems:"center",gap:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1,minWidth:0}}>
          <div style={{width:32,height:32,background:"var(--color-background-info)",borderRadius:"var(--border-radius-md)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{fontSize:16}}>📊</span>
          </div>
          <div style={{minWidth:0}}>
            <p style={{fontSize:14,fontWeight:600,margin:0,color:"var(--color-text-primary)"}}>IHS LV Production Analytics</p>
            <p style={{fontSize:11,margin:"1px 0 0",color:"var(--color-text-tertiary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              Light Vehicle Production Base Global · {latest.programs.toLocaleString()} programs · Latest: {latest.tag} ({latest.pubDate})
            </p>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0,alignItems:"center"}}>
          <span style={{fontSize:11,padding:"3px 9px",borderRadius:"var(--border-radius-md)",background:"var(--color-background-success)",color:"var(--color-text-success)",fontWeight:500}}>● Live</span>
          <span style={{fontSize:11,padding:"3px 9px",borderRadius:"var(--border-radius-md)",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-tertiary)",color:"var(--color-text-secondary)"}}>12 releases</span>
          <span style={{fontSize:11,padding:"3px 9px",borderRadius:"var(--border-radius-md)",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-tertiary)",color:"var(--color-text-secondary)"}}>May 2025 – Apr 2026</span>
        </div>
      </div>

      {/* ── TAB NAV ── */}
      <div style={{flexShrink:0,padding:"0 18px",borderBottom:"0.5px solid var(--color-border-tertiary)",display:"flex",gap:0,background:"var(--color-background-primary)"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:"10px 16px",fontSize:13,cursor:"pointer",background:"transparent",border:"none",
            borderBottom: tab===t.id?"2px solid var(--color-text-info)":"2px solid transparent",
            color: tab===t.id?"var(--color-text-info)":"var(--color-text-secondary)",
            fontWeight: tab===t.id?500:400,
            transition:"all .15s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{flex:1,overflowY:"auto",padding:"18px 18px 24px",minHeight:0}}>
        {tab==="ai"?(
          <div style={{display:"flex",flexDirection:"column",height:"min(72vh, 720px)",minHeight:520}}>
            {content.ai}
          </div>
        ):content[tab]}
      </div>
    </div>
    </AccessGate>
  );
}
