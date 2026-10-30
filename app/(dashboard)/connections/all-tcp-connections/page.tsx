import TcpConnections from "@/components/tcp-connections/TcpConnections";

export default function AllTcpConnectionsPage() {
  return (
    <div className="my-container flex flex-col gap-5 py-10">
      <TcpConnections />
    </div>
  );
}
