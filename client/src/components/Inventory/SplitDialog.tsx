import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useInventory } from "@/contexts/InventoryContext";

export function SplitDialog({ isOpen, onClose, item }) {
    const { splitStack } = useInventory();
    const [amount, setAmount] = useState(1);

    useEffect(() => {
        if (isOpen) {
            setAmount(1);
        }
    }, [isOpen]);

    if (!item) return null;

    const maxAmount = item.stackCount - 1;

    const handleSliderChange = (value) => {
        setAmount(value[0]);
    };

    const handleInputChange = (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 0;
        setAmount(Math.max(0, Math.min(val, maxAmount)));
    };

    const handleConfirm = () => {
        if (amount > 0 && amount <= maxAmount) {
            splitStack(item, amount);
        }
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[325px] bg-card border-border text-foreground z-[10001]">
                <DialogHeader>
                    <DialogTitle>Split Stack</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="flex items-center gap-4">
                        <Input
                            type="number"
                            value={amount}
                            onChange={handleInputChange}
                            className="w-20 bg-muted border-border text-foreground focus:ring-accent"
                            min={1}
                            max={maxAmount}
                        />
                        <span className="text-sm text-muted-foreground">/ {item.stackCount}</span>
                    </div>
                    <Slider
                        value={[amount]}
                        onValueChange={handleSliderChange}
                        max={maxAmount}
                        min={1}
                        step={1}
                        className="w-full"
                    />
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} className="border-border text-muted-foreground hover:bg-secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} className="bg-accent hover:bg-accent/80 text-white">
                        Split
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
