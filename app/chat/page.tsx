export default function Chats() {
  return (
    <form action="/chats/new" method="post">
      <input type="text" name="email" id="email" placeholder="Email" />
      <button>Start Chat</button>
    </form>
  );
}
