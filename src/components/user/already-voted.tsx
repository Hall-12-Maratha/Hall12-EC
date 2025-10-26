import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function AlreadyVoted() {
    return (
        <Card className="w-full">
            <CardHeader className="items-center text-center">
                 <CheckCircle2 className="h-16 w-16 text-green-500" />
                <CardTitle className="text-2xl">Thank You for Voting!</CardTitle>
                <CardDescription>
                    Your vote has been securely recorded. Results will be available after the election concludes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-center text-sm text-muted-foreground">
                    You can now close this page. Your participation is valuable to our community.
                </p>
            </CardContent>
        </Card>
    );
}
