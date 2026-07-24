// src/pages/design-system.tsx
// Design-system gallery — foundations + every atom/component of the amber
// redesign, built on the app's HeroUI primitives (@/components/ui). Ported 1:1
// from the Claude Design handoff `src/pages/ComponentsPage.jsx`
// (project 6302fd32…). Interactive pieces are live. Route: /design-system.
import type { NextPageWithLayout } from "@/types";
import type { ReactNode } from "react";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import {
  Button,
  Card,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  toastSuccess,
  useDisclosure,
} from "@/components/ui";

const WRAP = "w-full max-w-site mx-auto px-6";

const SWATCHES: [string, string][] = [
  ["Primary", "#eba513"], ["Primary 600", "#c2870a"], ["Primary 100", "#fdf2d5"],
  ["Foreground", "#181510"], ["Default 500", "#6d6656"], ["Divider", "#ece8df"],
  ["Content1", "#ffffff"], ["Background", "#f4f2ec"], ["Success", "#178a4e"],
  ["Danger", "#d6453f"], ["Secondary", "#6d5ae0"], ["Blue", "#2f6fed"],
];

const DesignSystemPage: NextPageWithLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className={`${WRAP} py-8 max-w-[1100px]`}>
        <div className="flex items-center gap-3 mb-1">
          <img src="/logo-icon.png" alt="" className="w-10 h-10 rounded-xl" />
          <span className="font-extrabold italic text-2xl">HYPER<span className="text-primary-600">COMMERCE</span></span>
        </div>
        <h1 className="text-2xl font-extrabold">Design System — Atoms &amp; Components</h1>
        <p className="text-sm text-default-500 mt-1 mb-7 max-w-[680px]">Built on HeroUI primitives, themed amber. Buttons, inputs, selection controls, chips, feedback, navigation and overlays — interactive pieces are live.</p>

        <Panel title="Foundations" sub="Colour tokens & type scale. Primary is amber #eba513.">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
            {SWATCHES.map(([name, hex]) => (
              <div key={name}>
                <div className="h-14 rounded-medium border border-divider" style={{ background: hex }} />
                <div className="text-xs font-bold mt-1.5">{name}</div>
                <div className="text-[11px] text-default-400 font-mono">{hex}</div>
              </div>
            ))}
          </div>
          <Divider className="mb-5" />
          <div className="flex flex-col gap-2.5">
            <div className="text-[40px] font-extrabold leading-none tracking-tight">Display / 40 · Bold</div>
            <div className="text-[28px] font-extrabold">Heading 1 / 28 · Bold</div>
            <div className="text-[21px] font-extrabold">Heading 2 / 21 · Bold</div>
            <div className="text-base font-bold">Heading 3 / 16 · Semibold</div>
            <div className="text-[15px] text-default-500">Body / 15 — the quick brown fox jumps over the lazy dog.</div>
            <div className="text-[11px] font-bold text-default-400 tracking-widest uppercase">Caption / 11 · Tracked uppercase</div>
          </div>
        </Panel>

        <Panel title="Buttons" sub="Variants, sizes, states.">
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <Button color="primary" size="md" className="font-extrabold">Primary</Button>
            <Button size="md" className="bg-foreground text-background font-extrabold">Secondary</Button>
            <Button size="md" variant="bordered" className="font-extrabold">Outline</Button>
            <Button size="md" variant="light" color="primary" className="font-extrabold">Ghost</Button>
            <Button size="md" color="danger" className="font-extrabold">Danger</Button>
            <Button size="md" isDisabled className="bg-content2 text-default-400 font-extrabold">Disabled</Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <Button color="primary" size="md" className="font-extrabold" startContent={<Icon icon="solar:bag-3-linear" className="text-lg" />}>With icon</Button>
            <Button color="primary" size="md" isIconOnly><Icon icon="solar:heart-linear" className="text-xl" /></Button>
            <Button variant="bordered" size="md" isIconOnly><Icon icon="solar:share-linear" className="text-xl" /></Button>
            <Button color="primary" size="md" isLoading className="font-extrabold">Loading</Button>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <Button color="primary" size="sm" className="font-extrabold">Small</Button>
            <Button color="primary" size="md" className="font-extrabold">Medium</Button>
            <Button color="primary" size="lg" className="font-extrabold">Large</Button>
          </div>
        </Panel>

        <Panel title="Inputs & forms" sub="Text fields, search, select, states.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="Full name" help="As per your ID"><Input placeholder="Enter your name" /></Field>
            <Field label="Email" help="We'll send order updates here"><Input placeholder="you@email.com" startContent={<Icon icon="solar:letter-linear" className="text-lg text-default-500" />} /></Field>
            <Field label="Phone" error="Enter a valid 10-digit number">
              <Input defaultValue="98765" classNames={{ inputWrapper: "h-11 bg-danger/10 !border-danger" }} />
            </Field>
            <Field label="Search"><Input placeholder="Search products" startContent={<Icon icon="solar:magnifer-linear" className="text-lg text-default-500" />} /></Field>
            <Field label="State">
              <div className="flex items-center justify-between px-3.5 h-11 bg-content2 border border-divider rounded-medium cursor-pointer">
                <span className="text-sm">Gujarat</span><Icon icon="solar:alt-arrow-down-linear" className="text-lg text-default-500" />
              </div>
            </Field>
            <Field label="Disabled"><Input defaultValue="Locked field" isDisabled classNames={{ inputWrapper: "h-11 opacity-60" }} /></Field>
          </div>
        </Panel>

        <Panel title="Selection controls" sub="Checkbox, radio, switch, stepper — all live.">
          <div className="flex flex-wrap gap-10 items-start">
            <CheckList />
            <RadioGroup defaultValue="std" className="flex flex-col gap-3">
              <div className="text-xs font-bold text-default-500">Delivery</div>
              <Radio value="std">Standard · Free</Radio>
              <Radio value="exp">Express · ₹49</Radio>
            </RadioGroup>
            <Switches />
            <Stepper />
          </div>
        </Panel>

        <Panel title="Chips, tags & status" sub="Filter chips selectable; status pills mirror order states.">
          <FilterChips />
          <div className="flex flex-wrap gap-2.5 items-center mt-5">
            <Pill color="secondary">Processing</Pill>
            <Pill color="success">Delivered</Pill>
            <Pill color="danger">Cancelled</Pill>
            <Pill color="secondary">COD</Pill>
            <Pill color="primary">Bestseller</Pill>
            <Pill className="bg-danger text-white">25% OFF</Pill>
            <Pill className="bg-content2"><Icon icon="solar:star-bold" className="text-[13px] text-primary" /> 4.2</Pill>
          </div>
        </Panel>

        <Panel title="Price & rating">
          <div className="flex flex-wrap gap-10 items-center">
            <div className="flex items-baseline gap-2.5">
              <span className="text-[26px] font-extrabold">₹4,291.15</span>
              <span className="text-[15px] text-default-400 line-through">₹4,768.05</span>
              <span className="text-[15px] font-extrabold text-success">10% OFF</span>
            </div>
            <div className="flex items-center gap-0.5 text-primary">
              {[1, 1, 1, 1, 0].map((f, i) => <Icon key={i} icon={f ? "solar:star-bold" : "solar:star-linear"} className="text-2xl" />)}
              <span className="text-sm text-default-500 ml-1.5 font-semibold">4.0 (128)</span>
            </div>
            <span className="flex items-center gap-1.5 bg-success text-white px-2.5 py-1 rounded-md text-sm font-extrabold">4.2 <Icon icon="solar:star-bold" className="text-[15px]" /></span>
          </div>
        </Panel>

        <Panel title="Progress & steppers">
          <div className="flex items-center max-w-[560px] mb-6">
            <TrackerStep icon="solar:check-read-linear" label="Confirmed" state="done" />
            <div className="flex-1 h-[3px] bg-primary mx-1.5 mb-[18px]" />
            <TrackerStep icon="solar:delivery-linear" label="Shipped" state="active" />
            <div className="flex-1 h-[3px] bg-divider mx-1.5 mb-[18px]" />
            <TrackerStep label="Delivered" state="todo" />
          </div>
          <div className="max-w-[560px]">
            <div className="flex justify-between text-xs font-bold text-default-500 mb-1.5"><span>Free delivery unlocked</span><span>₹75 / ₹75</span></div>
            <div className="h-2 rounded-full bg-content2 overflow-hidden"><div className="w-full h-full bg-primary" /></div>
          </div>
        </Panel>

        <Panel title="Overlays — modal, shutter, toast" sub="Live: trigger and dismiss.">
          <Overlays />
          <div className="text-[13px] font-extrabold mt-6 mb-3">Inline alerts</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InlineAlert color="success" icon="solar:check-circle-bold" text="Payment successful — order confirmed." />
            <InlineAlert color="danger" icon="solar:danger-triangle-bold" text="Card declined. Try another method." />
            <InlineAlert color="primary" icon="solar:info-circle-bold" text="Only 3 left in stock." />
            <InlineAlert color="secondary" icon="solar:delivery-bold" text="Arriving Tue, 24 Jul." />
          </div>
        </Panel>

        <Panel title="Data display" sub="List rows, coupon, address card, accordion (live), empty state.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Card className="overflow-hidden mb-5 p-0">
                <ListRow icon="solar:bag-3-linear" label="My Orders" border />
                <ListRow icon="solar:heart-linear" label="Wishlist" />
              </Card>
              <div className="flex gap-2.5">
                <Input placeholder="Coupon code" classNames={{ inputWrapper: "h-11" }} />
                <Button className="bg-foreground text-background font-extrabold shrink-0">Apply</Button>
              </div>
            </div>
            <div>
              <div className="border-[1.5px] border-primary bg-primary-100/50 rounded-medium px-4 py-3.5 mb-5">
                <div className="flex items-center justify-between mb-1.5"><span className="text-[13px] font-extrabold">Home</span><span className="text-[11px] font-extrabold text-primary-600 bg-content1 px-2 py-0.5 rounded-small">DEFAULT</span></div>
                <div className="text-[13px] text-default-500 leading-snug">Shri Swaminarayan Circle, Ghanshyam Nagar, Bhuj, Gujarat 370001</div>
              </div>
              <Accordion />
            </div>
          </div>
          <div className="border border-dashed border-divider rounded-large p-9 text-center mt-5">
            <div className="w-16 h-16 rounded-large bg-primary-100/60 grid place-items-center mx-auto mb-3.5"><Icon icon="solar:box-linear" className="text-3xl text-primary-600" /></div>
            <div className="text-base font-extrabold mb-1">Nothing here yet</div>
            <div className="text-[13px] text-default-500 mb-4">Your saved items will show up here.</div>
            <Button color="primary" className="font-extrabold">Start shopping</Button>
          </div>
        </Panel>
      </div>
    </div>
  );
};

// Bare page — no storefront header/footer around the gallery.
DesignSystemPage.getLayout = (page) => page;

export default DesignSystemPage;

function Panel({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <Card className="p-6 mb-5">
      <h2 className="text-xl font-extrabold mb-1">{title}</h2>
      {sub && <p className="text-[13px] text-default-500 mb-5">{sub}</p>}
      {children}
    </Card>
  );
}

function Field({ label, help, error, children }: { label: string; help?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-[13px] font-bold block mb-1.5">{label}</label>
      {children}
      {(help || error) && <div className={"text-xs mt-1.5 " + (error ? "text-danger font-semibold" : "text-default-500")}>{error || help}</div>}
    </div>
  );
}

function Pill({ color, className, children }: { color?: string; className?: string; children: ReactNode }) {
  const tone = color
    ? { primary: "bg-primary text-primary-foreground", secondary: "bg-secondary text-white", success: "bg-success text-white", danger: "bg-danger text-white" }[color] ?? "bg-content2"
    : "";
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${tone} ${className ?? ""}`}>{children}</span>;
}

function CheckBox({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <label onClick={onClick} className="flex items-center gap-3 cursor-pointer">
      <span className={"w-[22px] h-[22px] rounded-md border-[1.5px] grid place-items-center " + (on ? "bg-primary border-primary" : "border-divider")}>
        {on && <Icon icon="solar:check-read-linear" className="text-base text-primary-foreground" />}
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </label>
  );
}

function CheckList() {
  const [a, setA] = useState(true); const [b, setB] = useState(false);
  return <div className="flex flex-col gap-3.5"><CheckBox on={a} onClick={() => setA(!a)} label="Save this address" /><CheckBox on={b} onClick={() => setB(!b)} label="Email me offers" /></div>;
}

function SwitchRow({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <div onClick={onClick} className="flex items-center gap-3 cursor-pointer">
      <span className={"w-[46px] h-[26px] rounded-full relative transition-colors " + (on ? "bg-primary" : "bg-divider")}>
        <motion.span layout className="absolute top-[3px] w-5 h-5 rounded-full bg-white shadow" style={{ left: on ? 23 : 3 }} />
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

function Switches() {
  const [a, setA] = useState(true); const [b, setB] = useState(false);
  return <div className="flex flex-col gap-4"><SwitchRow on={a} onClick={() => setA(!a)} label="Notifications" /><SwitchRow on={b} onClick={() => setB(!b)} label="Dark receipts" /></div>;
}

function Stepper() {
  const [n, setN] = useState(1);
  return (
    <div>
      <div className="text-xs text-default-500 mb-2 font-semibold">Quantity stepper</div>
      <div className="inline-flex items-center gap-4 border-[1.5px] border-divider rounded-medium px-4 py-2">
        <button onClick={() => setN((v) => Math.max(1, v - 1))}><Icon icon="solar:minus-square-linear" className="text-xl" /></button>
        <span className="text-[15px] font-extrabold min-w-5 text-center">{n}</span>
        <button onClick={() => setN((v) => v + 1)}><Icon icon="solar:add-square-linear" className="text-xl" /></button>
      </div>
    </div>
  );
}

function FilterChips() {
  const [on, setOn] = useState<Record<string, boolean>>({ Fashion: true });
  const names = ["Fashion", "Electronics", "Home", "Beauty"];
  return (
    <div className="flex flex-wrap gap-2.5">
      {names.map((n) => {
        const active = !!on[n];
        return (
          <button key={n} onClick={() => setOn((s) => ({ ...s, [n]: !s[n] }))}
            className={"flex items-center gap-1.5 px-4 py-2 rounded-full border-[1.5px] font-bold text-[13px] transition-colors " + (active ? "border-primary bg-primary-100/50 text-primary-600" : "border-divider bg-content1")}>
            {active && <Icon icon="solar:check-read-linear" className="text-base" />}{n}
          </button>
        );
      })}
      <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-content2 font-bold text-[13px]">Size: M<Icon icon="solar:close-circle-linear" className="text-base text-default-500 cursor-pointer" /></span>
    </div>
  );
}

function TrackerStep({ icon, label, state }: { icon?: string; label: string; state: "done" | "active" | "todo" }) {
  const cls = state === "done" || state === "active" ? "bg-primary text-primary-foreground" : "bg-content2 border-[1.5px] border-divider";
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className={"w-7 h-7 rounded-full grid place-items-center " + cls}>{icon && <Icon icon={icon} className="text-base" />}</span>
      <span className={"text-[11px] " + (state === "todo" ? "text-default-400 font-bold" : "font-extrabold")}>{label}</span>
    </div>
  );
}

function InlineAlert({ color, icon, text }: { color: "success" | "danger" | "primary" | "secondary"; icon: string; text: string }) {
  const bg = { success: "bg-success/10", danger: "bg-danger/10", primary: "bg-primary-100/60", secondary: "bg-secondary/10" }[color];
  const fg = { success: "text-success", danger: "text-danger", primary: "text-primary-600", secondary: "text-secondary" }[color];
  return <div className={"flex items-center gap-2.5 px-4 py-3 rounded-medium " + bg}><Icon icon={icon} className={"text-xl " + fg} /><span className="text-[13px] font-semibold">{text}</span></div>;
}

function ListRow({ icon, label, border }: { icon: string; label: string; border?: boolean }) {
  return (
    <div className={"flex items-center gap-3 px-4 py-3.5 " + (border ? "border-b border-divider" : "")}>
      <Icon icon={icon} className="text-2xl" /><span className="flex-1 text-sm font-semibold">{label}</span>
      <Icon icon="solar:alt-arrow-right-linear" className="text-xl text-default-400" />
    </div>
  );
}

function Accordion() {
  const data: [string, string][] = [
    ["What is the return policy?", "7-day easy returns on most items. Perishables and innerwear are non-returnable."],
    ["How is delivery calculated?", "Free over ₹75; otherwise a flat ₹190.76 based on weight and distance."],
  ];
  const [open, setOpen] = useState(0);
  return (
    <div className="flex flex-col gap-2.5">
      {data.map(([q, body], i) => (
        <div key={q} className="border border-divider rounded-medium overflow-hidden">
          <button onClick={() => setOpen((o) => (o === i ? -1 : i))} className="w-full flex items-center justify-between px-4 py-3.5">
            <span className="text-sm font-bold text-left">{q}</span>
            <motion.span animate={{ rotate: open === i ? 180 : 0 }}><Icon icon="solar:alt-arrow-down-linear" className="text-xl text-default-500" /></motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-4 pb-3.5 text-[13px] text-default-500 leading-snug">{body}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function Overlays() {
  const modal = useDisclosure();
  const [sheet, setSheet] = useState(false);
  const [def, setDef] = useState(true);
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button color="primary" className="font-extrabold" onPress={modal.onOpen}>Open modal (form)</Button>
        <Button className="bg-foreground text-background font-extrabold" onPress={() => setSheet(true)}>Open shutter</Button>
        <Button variant="bordered" className="font-extrabold" onPress={() => toastSuccess("Saved", "Your address was added successfully.")}>Show toast</Button>
      </div>

      <Modal isOpen={modal.isOpen} onOpenChange={modal.onOpenChange} size="lg" backdrop="blur">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Add new address</ModalHeader>
              <ModalBody className="gap-4 pb-2">
                <div className="grid grid-cols-2 gap-3.5">
                  <Field label="Full name"><Input placeholder="Your name" /></Field>
                  <Field label="Phone"><Input placeholder="10-digit number" /></Field>
                </div>
                <Field label="Address"><Input placeholder="House no, street, area" /></Field>
                <div className="grid grid-cols-3 gap-3.5">
                  <Field label="City"><Input placeholder="Bhuj" /></Field>
                  <Field label="State"><div className="flex items-center justify-between px-3.5 h-11 bg-content2 border border-divider rounded-medium"><span className="text-sm">Gujarat</span><Icon icon="solar:alt-arrow-down-linear" className="text-lg text-default-500" /></div></Field>
                  <Field label="Pincode"><Input placeholder="370001" /></Field>
                </div>
                <label onClick={() => setDef((v) => !v)} className="flex items-center gap-3 cursor-pointer">
                  <span className={"w-[22px] h-[22px] rounded-md border-[1.5px] grid place-items-center " + (def ? "bg-primary border-primary" : "border-divider")}>{def && <Icon icon="solar:check-read-linear" className="text-base text-primary-foreground" />}</span>
                  <span className="text-sm font-semibold">Set as default address</span>
                </label>
              </ModalBody>
              <ModalFooter>
                <Button variant="bordered" className="font-extrabold flex-1" onPress={onClose}>Cancel</Button>
                <Button color="primary" className="font-extrabold flex-[2]" onPress={onClose}>Save address</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <AnimatePresence>
        {sheet && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <div onClick={() => setSheet(false)} className="absolute inset-0 bg-black/50" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.28 }} className="relative w-full max-w-[520px] bg-content1 rounded-t-[22px] px-6 pt-3.5 pb-6">
              <div className="w-11 h-1 rounded-full bg-divider mx-auto mb-4" />
              <div className="text-[17px] font-extrabold mb-3.5">Sort by</div>
              {["Relevance", "Price: low to high", "Price: high to low", "Customer rating"].map((o, i) => (
                <div key={o} className="flex items-center justify-between py-3.5 border-b border-divider last:border-0">
                  <span className="text-sm font-semibold">{o}</span>
                  <Icon icon={i === 0 ? "solar:check-circle-bold" : "solar:record-circle-linear"} className={"text-xl " + (i === 0 ? "text-primary" : "text-default-400")} />
                </div>
              ))}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
