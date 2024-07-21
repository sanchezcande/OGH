import { ReactComponent as Security } from "../../../assets/icons/Security.svg";
import { ReactComponent as UXUI } from "../../../assets/icons/UXUI.svg";
import { ReactComponent as GraphicDesign } from "../../../assets/icons/GraphicDesign.svg";
import { ReactComponent as UXUI1 } from "../../../assets/icons/UXUI1.svg";

const DataSquare = (t) => [
  {
    id: 1,
    title: t('frontendTitle'),
    image: Security,
    description: t('frontendDescription'),
  },
  {
    id: 2,
    title: t('backendTitle'),
    image: UXUI,
    description: t('backendDescription'),
  },
  {
    id: 3,
    title: t('uxuiTitle'),
    image: UXUI1,
    description: t('uxuiDescription'),
  },
  {
    id: 4,
    title: t('graphicDesignTitle'),
    image: GraphicDesign,
    description: t('graphicDesignDescription'),
  },
];

export default DataSquare;
