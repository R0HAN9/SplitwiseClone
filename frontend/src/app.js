import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000";

function App() {
  const [currentView, setCurrentView] = useState("groups");
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${API_BASE}/groups`);
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Splitwise Clone</h1>
          <div className="space-x-4">
            <button
              onClick={() => setCurrentView("groups")}
              className={`px-4 py-2 rounded ${
                currentView === "groups" ? "bg-blue-800" : "bg-blue-500"
              }`}
            >
              Groups
            </button>
            <button
              onClick={() => setCurrentView("create-group")}
              className={`px-4 py-2 rounded ${
                currentView === "create-group" ? "bg-blue-800" : "bg-blue-500"
              }`}
            >
              Create Group
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-4">
        {currentView === "groups" && (
          <GroupsList
            groups={groups}
            onSelectGroup={(group) => {
              setSelectedGroup(group);
              setCurrentView("group-details");
            }}
          />
        )}

        {currentView === "create-group" && (
          <CreateGroupForm
            onGroupCreated={() => {
              fetchGroups();
              setCurrentView("groups");
            }}
          />
        )}

        {currentView === "group-details" && selectedGroup && (
          <GroupDetails
            group={selectedGroup}
            onBack={() => setCurrentView("groups")}
            onExpenseAdded={() => fetchGroups()}
          />
        )}
      </div>
    </div>
  );
}

function GroupsList({ groups, onSelectGroup }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Your Groups</h2>
      {groups.length === 0 ? (
        <p className="text-gray-600">No groups yet. Create your first group!</p>
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectGroup(group)}
            >
              <h3 className="text-xl font-semibold">{group.name}</h3>
              <p className="text-gray-600">
                Members: {group.users.map((u) => u.name).join(", ")}
              </p>
              <p className="text-sm text-gray-500">
                {group.expenses.length} expenses
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateGroupForm({ onGroupCreated }) {
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState([""]);
  const [loading, setLoading] = useState(false);

  const addUser = () => {
    setUsers([...users, ""]);
  };

  const updateUser = (index, value) => {
    const newUsers = [...users];
    newUsers[index] = value;
    setUsers(newUsers);
  };

  const removeUser = (index) => {
    if (users.length > 1) {
      setUsers(users.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const filteredUsers = users.filter((user) => user.trim() !== "");

    if (filteredUsers.length < 2) {
      alert("Please add at least 2 users");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName,
          users: filteredUsers,
        }),
      });

      if (response.ok) {
        onGroupCreated();
        setGroupName("");
        setUsers([""]);
      } else {
        alert("Error creating group");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Create New Group</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Members
          </label>
          {users.map((user, index) => (
            <div key={index} className="flex mb-2">
              <input
                type="text"
                value={user}
                onChange={(e) => updateUser(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l focus:outline-none focus:border-blue-500"
                placeholder="Enter user name"
              />
              {users.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeUser(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-r hover:bg-red-600"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addUser}
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            + Add another member
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Group"}
        </button>
      </form>
    </div>
  );
}

function GroupDetails({ group, onBack, onExpenseAdded }) {
  const [activeTab, setActiveTab] = useState("expenses");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [balances, setBalances] = useState(null);

  useEffect(() => {
    if (activeTab === "balances") {
      fetchBalances();
    }
  }, [activeTab, group.id]);

  const fetchBalances = async () => {
    try {
      const response = await fetch(`${API_BASE}/groups/${group.id}/balances`);
      const data = await response.json();
      setBalances(data);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-4">
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mr-4"
        >
          ← Back
        </button>
        <h2 className="text-2xl font-bold">{group.name}</h2>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("expenses")}
              className={`px-6 py-3 font-medium ${
                activeTab === "expenses"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveTab("balances")}
              className={`px-6 py-3 font-medium ${
                activeTab === "balances"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Balances
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "expenses" && (
            <ExpensesTab
              group={group}
              showAddExpense={showAddExpense}
              setShowAddExpense={setShowAddExpense}
              onExpenseAdded={onExpenseAdded}
            />
          )}

          {activeTab === "balances" && <BalancesTab balances={balances} />}
        </div>
      </div>
    </div>
  );
}

function ExpensesTab({
  group,
  showAddExpense,
  setShowAddExpense,
  onExpenseAdded,
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Expenses</h3>
        <button
          onClick={() => setShowAddExpense(!showAddExpense)}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          + Add Expense
        </button>
      </div>

      {showAddExpense && (
        <AddExpenseForm
          group={group}
          onCancel={() => setShowAddExpense(false)}
          onExpenseAdded={() => {
            setShowAddExpense(false);
            onExpenseAdded();
          }}
        />
      )}

      <div className="space-y-2">
        {group.expenses.length === 0 ? (
          <p className="text-gray-600">No expenses yet.</p>
        ) : (
          group.expenses.map((expense) => (
            <div key={expense.id} className="border rounded p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{expense.description}</h4>
                  <p className="text-sm text-gray-600">
                    Paid by {expense.paid_by.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${expense.amount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AddExpenseForm({ group, onCancel, onExpenseAdded }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(group.users[0]?.name || "");
  const [splitType, setSplitType] = useState("equal");
  const [percentageSplits, setPercentageSplits] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (splitType === "percentage") {
      const initialSplits = {};
      group.users.forEach((user) => {
        initialSplits[user.name] = 0;
      });
      setPercentageSplits(initialSplits);
    }
  }, [splitType, group.users]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (splitType === "percentage") {
      const totalPercentage = Object.values(percentageSplits).reduce(
        (sum, val) => sum + val,
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert("Percentages must add up to 100%");
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE}/groups/${group.id}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          paid_by: paidBy,
          split_type: splitType,
          splits: splitType === "percentage" ? percentageSplits : {},
        }),
      });

      if (response.ok) {
        onExpenseAdded();
      } else {
        alert("Error creating expense");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error creating expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded mb-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Paid by</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          >
            {group.users.map((user) => (
              <option key={user.id} value={user.name}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Split Type</label>
          <select
            value={splitType}
            onChange={(e) => setSplitType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          >
            <option value="equal">Equal Split</option>
            <option value="percentage">Percentage Split</option>
          </select>
        </div>
      </div>

      {splitType === "percentage" && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Percentage Split
          </label>
          <div className="grid grid-cols-2 gap-2">
            {group.users.map((user) => (
              <div key={user.id} className="flex items-center">
                <span className="w-20 text-sm">{user.name}:</span>
                <input
                  type="number"
                  step="0.01"
                  value={percentageSplits[user.name] || 0}
                  onChange={(e) =>
                    setPercentageSplits({
                      ...percentageSplits,
                      [user.name]: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="ml-1 text-sm">%</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Total:{" "}
            {Object.values(percentageSplits)
              .reduce((sum, val) => sum + val, 0)
              .toFixed(1)}
            %
          </p>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Expense"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function BalancesTab({ balances }) {
  if (!balances) {
    return <div>Loading balances...</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Group Balances</h3>

      <div className="mb-6">
        <h4 className="font-medium mb-2">Individual Balances</h4>
        <div className="grid gap-2">
          {Object.entries(balances.balances).map(([user, balance]) => (
            <div
              key={user}
              className="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <span>{user}</span>
              <span
                className={balance >= 0 ? "text-green-600" : "text-red-600"}
              >
                ${Math.abs(balance).toFixed(2)}{" "}
                {balance >= 0 ? "gets back" : "owes"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {balances.settlements.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Suggested Settlements</h4>
          <div className="space-y-2">
            {balances.settlements.map((settlement, index) => (
              <div
                key={index}
                className="p-3 bg-blue-50 rounded border-l-4 border-blue-400"
              >
                <span className="font-medium">{settlement.from}</span>
                <span className="mx-2">owes</span>
                <span className="font-medium">{settlement.to}</span>
                <span className="mx-2">→</span>
                <span className="font-semibold text-blue-600">
                  ${settlement.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {balances.settlements.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>All settled up! 🎉</p>
        </div>
      )}
    </div>
  );
}

export default App;
