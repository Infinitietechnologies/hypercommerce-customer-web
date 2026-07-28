/**
 * The UI layer. This is the ONLY place `@heroui/react` may be imported —
 * everything else in the app imports from `@/components/ui`.
 *
 * Wrapped components carry Flutter parity (see each file). Everything under
 * "pass-through" needs no behaviour change and is re-exported as-is so the
 * import boundary still holds.
 */

// Wrapped — behaviour or styling adjusted to match the Flutter app.
export { default as Button } from "./Button";
export { default as Card } from "./Card";
export { default as Chip } from "./Chip";
export { default as EmptyState } from "./EmptyState";
export { default as ErrorState } from "./ErrorState";
export { default as Input } from "./Input";
export { default as Link } from "./Link";
export { default as Sheet } from "./Sheet";
export { default as Skeleton } from "./Skeleton";
export { default as Textarea } from "./Textarea";
export { toast, toastError, toastInfo, toastSuccess } from "./toast";

export type { ButtonProps } from "./Button";
export type { EmptyStateProps } from "./EmptyState";
export type { ErrorStateProps } from "./ErrorState";
export type { SheetProps } from "./Sheet";

// Pass-through — token-themed already, no wrapper needed.
export {
  Accordion,
  AccordionItem,
  Alert,
  Autocomplete,
  AutocompleteItem,
  Avatar,
  Badge,
  BreadcrumbItem,
  Breadcrumbs,
  CardBody,
  CardFooter,
  CardHeader,
  Checkbox,
  Divider,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Form,
  Image,
  InputOtp,
  Kbd,
  Listbox,
  ListboxItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  Pagination,
  Progress,
  Radio,
  RadioGroup,
  ScrollShadow,
  Select,
  SelectItem,
  Spinner,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Tooltip,
  User,
  useDisclosure,
} from "@heroui/react";
