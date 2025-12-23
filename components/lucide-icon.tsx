import { ItemType } from "@/utils/types";
import {
  BotMessageSquare,
  Box,
  BrickWallShieldIcon,
  Code2,
  Settings,
  SquareUser,
  User,
  type LucideIcon as LucideIconType,
} from "lucide-react";

const ASSET_ICON_MAP: Record<ItemType, LucideIconType> = {
  chat: BotMessageSquare,
  analysis: BrickWallShieldIcon,
  project: Box,
  code: Code2,
  team: SquareUser,
  member: User,
  settings: Settings,
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
