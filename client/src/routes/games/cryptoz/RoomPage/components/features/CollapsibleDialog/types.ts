export interface TCollapsibleDialogProps {
  title: string;
  canClose?: boolean;
  canCollapse?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}
