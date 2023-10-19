export default function Chats() {
  return (
    <form action="/chats/new" method="post">
      <input type="text" name="with" id="with" placeholder="With" />
      <button>Start Chat</button>
    </form>
  );
}
