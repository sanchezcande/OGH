import Security from "../../../assets/images/placeholder-security.png"; // Placeholder - replace with actual image
import UXUI from "../../../assets/images/placeholder-uxui.png"; // Placeholder - replace with actual image
import UXUI1 from "../../../assets/images/placeholder-uxui1.png"; // Placeholder - replace with actual image
import GraphicDesign from "../../../assets/images/placeholder-graphicdesign.png"; // Placeholder - replace with actual image

const DataSquare = (t) => [
  {
    id: 1,
    title: t("frontendTitle"),
    image: Security,
    description: t("frontendDescription"),
  },
  {
    id: 2,
    title: t("backendTitle"),
    image: UXUI,
    description: t("backendDescription"),
  },
  {
    id: 3,
    title: t("uxuiTitle"),
    image: UXUI1,
    description: t("uxuiDescription"),
  },
  {
    id: 4,
    title: t("graphicDesignTitle"),
    image: GraphicDesign,
    description: t("graphicDesignDescription"),
  },
];

export default DataSquare;
