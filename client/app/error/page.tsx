import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
function page() {
  return (
    <div>
      <p>Somewhere, Something went wrong!</p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Go Back Home!
      </Link>
    </div>
  );
}

export default page;
