import { ItemType } from "@/utils/types";
import {
  BotMessageSquare,
  Box,
  Code2,
  Search,
  Shield,
  SquareUser,
  User,
  type LucideIcon as LucideIconType,
} from "lucide-react";

const ASSET_ICON_MAP: Record<ItemType, LucideIconType> = {
  chat: BotMessageSquare,
  analysis: Shield,
  project: Box,
  code: Code2,
  team: SquareUser,
  member: User,
  analysis_version: Search,
};

export const getIcon = (type: ItemType): LucideIconType => {
  return ASSET_ICON_MAP[type];
};

type IconProps = React.ComponentProps<"svg"> & {
  assetType: ItemType;
};

const LucideIcon: React.FC<IconProps> = ({ assetType, ...props }) => {
  const Icon = getIcon(assetType);

  return <Icon {...props} />;
};

export default LucideIcon;
