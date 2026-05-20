import { PublicNav } from "@/components/layout/public-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function forgotpasswordPage() {
  return (
    <div>
      <PublicNav />
      <main className="px-4 py-16">
        <Card className="mx-auto max-w-md">
          <CardHeader><CardTitle>forgot-password</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Email address" />
            
            <Button className="w-full">forgot-password</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
