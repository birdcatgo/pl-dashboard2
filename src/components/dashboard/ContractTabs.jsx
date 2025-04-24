import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContractPreview from './ContractPreview';

const ContractTabs = ({ contractor }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contractor Contracts</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="nda" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="nda">NDA</TabsTrigger>
            <TabsTrigger value="mediaBuyer">Media Buyer Contractor Agreement</TabsTrigger>
            <TabsTrigger value="thirtyDay">30 Day Contract</TabsTrigger>
            <TabsTrigger value="postThirtyDay">Post 30 Day Contract</TabsTrigger>
          </TabsList>
          <TabsContent value="nda">
            <ContractPreview
              contractor={contractor}
              contractType="nda"
              onClose={() => {}}
            />
          </TabsContent>
          <TabsContent value="mediaBuyer">
            <ContractPreview
              contractor={contractor}
              contractType="mediaBuyer"
              onClose={() => {}}
            />
          </TabsContent>
          <TabsContent value="thirtyDay">
            <ContractPreview
              contractor={contractor}
              contractType="thirtyDay"
              onClose={() => {}}
            />
          </TabsContent>
          <TabsContent value="postThirtyDay">
            <ContractPreview
              contractor={contractor}
              contractType="postThirtyDay"
              onClose={() => {}}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContractTabs; 