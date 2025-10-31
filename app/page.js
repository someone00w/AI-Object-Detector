import ObjectDetection from "@/components/object-detection";
import UserList from "@/components/UserList";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="gradient-title font-extrabold text-3xl md:text-6xl lg:text-8xl tracking-tighter md:px-6 text-center">
        Thief Detection Alarm
      </h1>

      <ObjectDetection />

      <section className="w-full max-w-3xl mt-12 p-6 bg-white rounded shadow text-black">
        <h2 className="text-2xl font-bold mb-4">Users</h2>
        <UserList />
      </section>
    </main>
  );
}