import type { ModalProps } from "@heroui/react";
import type { ReactNode } from "react";

import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

import { useScreenType } from "@/hooks/useScreenType";

type SheetChildren = ReactNode | ((onClose: () => void) => ReactNode);

export interface SheetProps
  extends Omit<
    ModalProps,
    "children" | "title" | "placement" | "scrollBehavior"
  > {
  /** Rendered inside the header slot. */
  title?: ReactNode;
  /** Accepts a render function so the body can close the sheet itself. */
  children?: SheetChildren;
  footer?: ReactNode;
}

const renderBody = (children: SheetChildren, onClose: () => void) =>
  typeof children === "function" ? children(onClose) : children;

/**
 * The Flutter app presents these flows as bottom sheets
 * (hypercommerce-customer-app/lib/utils/widgets/*_bottom_sheet.dart).
 * Mobile therefore gets a bottom drawer with a 16px top radius and a drag
 * handle; tablet and up get a centred modal, which suits a pointer.
 *
 * Use this instead of Modal directly for anything the app shows as a sheet:
 * filters, sort, variant pickers, address and country selection, confirmations.
 */
const Sheet = ({ title, children, footer, ...props }: SheetProps) => {
  const screen = useScreenType();
  const isMobile = screen === "mobile";

  if (isMobile) {
    return (
      <Drawer
        placement="bottom"
        {...props}
        classNames={{
          ...props.classNames,
          base: `rounded-t-xlarge rounded-b-none max-h-[90dvh] ${props.classNames?.base ?? ""}`,
        }}
      >
        <DrawerContent>
          {(onClose) => (
            <>
              <div
                aria-hidden="true"
                className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-default-300"
              />
              {title ? <DrawerHeader>{title}</DrawerHeader> : null}
              <DrawerBody>
                {renderBody(children, onClose)}
              </DrawerBody>
              {footer ? <DrawerFooter>{footer}</DrawerFooter> : null}
            </>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Modal
      placement="center"
      radius="lg"
      scrollBehavior="inside"
      {...props}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {title ? <ModalHeader>{title}</ModalHeader> : null}
            <ModalBody>
              {renderBody(children, onClose)}
            </ModalBody>
            {footer ? <ModalFooter>{footer}</ModalFooter> : null}
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default Sheet;
