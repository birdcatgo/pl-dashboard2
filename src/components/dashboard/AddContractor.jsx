import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const AddContractor = ({ onAdd }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contractor, setContractor] = useState({
    name: '',
    email: '',
    basePay: '',
    frequency: 'weekly',
    commission: '',
    position: 'Media Buyer',
    contractType: 'New',
    ndaSigned: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(contractor);
    setIsOpen(false);
    setContractor({
      name: '',
      email: '',
      basePay: '',
      frequency: 'weekly',
      commission: '',
      position: 'Media Buyer',
      contractType: 'New',
      ndaSigned: false
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="mb-4">
        Add New Contractor
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Contractor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={contractor.name}
                onChange={(e) => setContractor({ ...contractor, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={contractor.email}
                onChange={(e) => setContractor({ ...contractor, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="basePay">Base Pay</Label>
              <Input
                id="basePay"
                type="number"
                value={contractor.basePay}
                onChange={(e) => setContractor({ ...contractor, basePay: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Payment Frequency</Label>
              <Select
                value={contractor.frequency}
                onValueChange={(value) => setContractor({ ...contractor, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission">Commission (%)</Label>
              <Input
                id="commission"
                type="number"
                value={contractor.commission}
                onChange={(e) => setContractor({ ...contractor, commission: e.target.value })}
                required
              />
            </div>

            <DialogFooter>
              <Button type="submit">Add Contractor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddContractor; 