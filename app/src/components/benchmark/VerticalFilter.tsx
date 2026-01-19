import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function VerticalFilter({
  options,
  selected,
  onChange,
  placeholder = "Filter by vertical...",
}: MultiSelectProps) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="justify-between min-w-[200px] h-10"
        >
          <div className="flex items-center gap-1 overflow-hidden">
            {selected.length === 0 ? (
              <span className="text-muted-foreground text-sm">
                {placeholder}
              </span>
            ) : (
              <div className="flex items-center gap-1 flex-wrap">
                {selected.slice(0, 2).map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="text-xs h-5 px-1.5 flex items-center gap-1"
                  >
                    {item}
                  </Badge>
                ))}
                {selected.length > 2 && (
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    +{selected.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-2">
          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option)}
                className={cn(
                  "flex items-center gap-2 w-full px-1.5 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer focus:outline-none focus:ring-0",
                  selected.includes(option) && "bg-accent",
                )}
              >
                <Checkbox
                  checked={selected.includes(option)}
                  onChange={() => {}}
                  className="pointer-events-none"
                />
                <span className="flex-1 text-left capitalize">{option}</span>
                {selected.includes(option) && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
          {selected.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="flex w-full justify-start items-center text-xs h-7 mt-1"
            >
              <X className="size-3" />
              <span>Clear all</span>
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
