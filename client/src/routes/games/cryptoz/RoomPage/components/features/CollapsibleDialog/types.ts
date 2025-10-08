export interface TCollapsibleDialogProps {
  dialogId: string;
  title: string;
  canClose?: boolean;
  canCollapse?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}
