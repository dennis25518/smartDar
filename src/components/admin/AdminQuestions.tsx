import { useState } from "react";
import { MessageCircle, Tag, Satellite, User, HelpCircle } from "lucide-react";
import { SupportTicket } from "../../hooks/useAdminQuestions";

interface AdminQuestionsProps {
  tickets: SupportTicket[];
  updateTicket: (
    ticketId: string,
    updates: Partial<SupportTicket>,
  ) => Promise<boolean>;
}

export default function AdminQuestions({
  tickets: initialTickets,
  updateTicket,
}: AdminQuestionsProps) {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null,
  );
  const [responseMessage, setResponseMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const tickets = initialTickets;

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus =
      filterStatus === "all" || ticket.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || ticket.priority === filterPriority;
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseMessage.trim()) return;

    const success = await updateTicket(selectedTicket.id, {
      response_message: responseMessage,
      status: "resolved",
    });

    if (success) {
      setResponseMessage("");
      setSelectedTicket(null);
      // The hook will automatically update the tickets list via real-time subscription
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-purple-100 text-purple-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const categoryIcons: Record<string, JSX.Element> = {
    technical: <MessageCircle className="h-4 w-4" />,
    billing: <Tag className="h-4 w-4" />,
    account: <User className="h-4 w-4" />,
    sensor: <Satellite className="h-4 w-4" />,
    general: <HelpCircle className="h-4 w-4" />,
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Open Tickets</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">
            {tickets.filter((t) => t.status === "open").length}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium">In Progress</p>
          <p className="text-3xl font-bold text-purple-900 mt-1">
            {tickets.filter((t) => t.status === "in-progress").length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Resolved</p>
          <p className="text-3xl font-bold text-green-900 mt-1">
            {tickets.filter((t) => t.status === "resolved").length}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">High Priority</p>
          <p className="text-3xl font-bold text-red-900 mt-1">
            {tickets.filter((t) => t.priority === "high").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div className="text-sm text-gray-600 py-2">
            {filteredTickets.length} tickets
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
            <h3 className="font-bold text-gray-900">Tickets</h3>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-200">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition border-l-4 ${
                    selectedTicket?.id === ticket.id
                      ? "border-green-500 bg-green-50"
                      : "border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">
                      {categoryIcons[ticket.category] || (
                        <HelpCircle className="h-4 w-4" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-gray-600">
                        {ticket.ticket_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                        ticket.status,
                      )}`}
                    >
                      {ticket.status}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(
                        ticket.priority,
                      )}`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No tickets found
              </div>
            )}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          {selectedTicket ? (
            <div className="space-y-6">
              {/* Ticket Info */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedTicket.subject}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedTicket.ticket_number}
                    </p>
                  </div>
                  <span className="text-2xl">
                    {categoryIcons[selectedTicket.category] || (
                      <HelpCircle className="h-6 w-6" />
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600 font-medium uppercase">
                      Status
                    </p>
                    <span
                      className={`inline-block text-sm px-3 py-1 rounded-full font-medium mt-1 ${getStatusColor(
                        selectedTicket.status,
                      )}`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-medium uppercase">
                      Priority
                    </p>
                    <span
                      className={`inline-block text-sm px-3 py-1 rounded-full font-medium mt-1 ${getPriorityColor(
                        selectedTicket.priority,
                      )}`}
                    >
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">From</p>
                    <p className="text-gray-900">{selectedTicket.name}</p>
                    <p className="text-gray-600">{selectedTicket.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Created</p>
                    <p className="text-gray-900">
                      {new Date(selectedTicket.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">
                      {new Date(selectedTicket.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-600 font-medium uppercase mb-2">
                  Category
                </p>
                <span className="text-sm px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
                  {selectedTicket.category}
                </span>
              </div>

              {/* Message */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-600 font-medium uppercase mb-2">
                  Message
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 whitespace-pre-wrap">
                  {selectedTicket.message}
                </div>
              </div>

              {/* Response */}
              {selectedTicket.response_message && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs text-green-600 font-medium uppercase mb-2">
                    Our Response
                  </p>
                  <div className="text-sm text-green-900 whitespace-pre-wrap">
                    {selectedTicket.response_message}
                  </div>
                </div>
              )}

              {/* Response Form */}
              {selectedTicket.status !== "resolved" && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-600 font-medium uppercase mb-2">
                    Send Response
                  </p>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Type your response here..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
                  />
                  <button
                    onClick={handleSendResponse}
                    disabled={!responseMessage.trim()}
                    className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                  >
                    Send Response & Resolve
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <p className="text-center">
                Select a ticket from the list to view details and respond
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
