import { Transition } from "@headlessui/react";
import clsx from "clsx";
import { useState } from "react";

function Example() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen((open) => !open)}>Toggle</button>
      <Transition show={open}>
        <div
          className={clsx([
            // Base styles
            "absolute w-48 border transition ease-in-out",
            // Shared closed styles
            "data-[closed]:opacity-0",
            // Entering styles
            "data-[enter]:duration-100 data-[enter]:data-[closed]:-translate-x-full",
            // Leaving styles
            "data-[leave]:duration-300 data-[leave]:data-[closed]:translate-x-full",
          ])}
        >
          I will enter from the left and leave to the right
        </div>
      </Transition>
    </div>
  );
}

export default Example;
