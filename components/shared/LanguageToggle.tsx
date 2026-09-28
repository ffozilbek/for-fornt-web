"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { useState } from "react";

export default function LanguageToggler() {
  const [lang, setLang] = useState("uz");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon">
            <Languages />
            <span className="sr-only">Toggle theme</span>
          </Button>
        }
      />
      <DropdownMenuContent className="" align="end">
        <DropdownMenuRadioGroup value={lang} onValueChange={setLang}>
          <DropdownMenuRadioItem value="uz">uz</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="ru">ru</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">en</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
