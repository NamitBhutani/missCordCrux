import { Button } from "@/components/ui/button";
export default function Login() {
  return (
    <div className="flex h-screen justify-center items-center">
      <form
        className="p-4 border rounded shadow-md"
        action="/auth/login"
        method="post"
      >
        <Button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Log In
        </Button>
      </form>
    </div>
  );
}
