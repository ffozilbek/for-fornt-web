import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export default function CustomSkeleton() {
  return (
    <Card className="h-30">
      <CardHeader>
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-6 w-2/3" />
      </CardContent>
    </Card>
  );
}
