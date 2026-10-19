import {
  FaAndroid,
  FaApple,
  FaBookOpen,
  FaBrain,
  FaChartLine,
  FaCloud,
  FaCode,
  FaCubes,
  FaDatabase,
  FaGamepad,
  FaJava,
  FaJsSquare,
  FaLaptopCode,
  FaMobileAlt,
  FaPaintBrush,
  FaPython,
  FaReact,
  FaShieldAlt,
  FaSquareRootAlt,
} from "react-icons/fa"

// Categories are free-text names from the database, so icons are matched by keyword.
// First matching rule wins: keep specific technologies above broad topics.
const RULES = [
  [/\b(ai|ml|machine learning|artificial intelligence|deep learning)\b/, FaBrain],
  [/android/, FaAndroid],
  [/\b(ios|swift)\b/, FaApple],
  [/python/, FaPython],
  [/\bjava\b/, FaJava],
  [/javascript|typescript|\bjs\b/, FaJsSquare],
  [/react/, FaReact],
  [/data|analytics|\bsql\b|database/, FaDatabase],
  [/cloud|devops|\baws\b|azure/, FaCloud],
  [/security|cyber/, FaShieldAlt],
  [/design|\bui\b|\bux\b/, FaPaintBrush],
  [/web|frontend|backend|full ?stack|html|css/, FaLaptopCode],
  [/mobile|\bapps?\b/, FaMobileAlt],
  [/game/, FaGamepad],
  [/blockchain|crypto|web3/, FaCubes],
  [/business|marketing|finance/, FaChartLine],
  [/math/, FaSquareRootAlt],
  [/program|coding|software|\bdsa\b|algorithm/, FaCode],
]

export const getCategoryIcon = (name = "") => {
  const normalized = name.toLowerCase()
  return RULES.find(([pattern]) => pattern.test(normalized))?.[1] ?? FaBookOpen
}

function CategoryIcon({ name, ...iconProps }) {
  const Icon = getCategoryIcon(name)
  return <Icon aria-hidden="true" {...iconProps} />
}

export default CategoryIcon
