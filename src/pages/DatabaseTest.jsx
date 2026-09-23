import { useState } from "react";

import { addProposal, deleteProposal, getProposals } from "../services/reportService";

function DatabaseTest() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setMessage("");

    try {
      const data = await getProposals();

      setRows(data);
    } catch (error) {
      console.error(error);

      setMessage(`Gagal mengambil data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleInsert() {
    if (saving) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await addProposal({
        unit: "SURAKARTA",
        cadeb: "TEST DATABASE",
        plafond: 100000000,
        freshMoney: 50000000,
        produk: "KUR K",
        posisi: "Admin",
      });

      setMessage("Data berhasil ditambahkan.");

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(`Gagal menambahkan data: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setMessage("");

    try {
      await deleteProposal(id);

      setMessage("Data berhasil dihapus.");

      await loadData();
    } catch (error) {
      console.error(error);

      setMessage(`Gagal menghapus data: ${error.message}`);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "#f8fafc",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <h1>Database Test</h1>

        <p>Halaman ini hanya digunakan untuk menguji koneksi React → Supabase.</p>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <button type="button" onClick={loadData} disabled={loading}>
            {loading ? "Memuat..." : "Reload"}
          </button>

          <button type="button" onClick={handleInsert} disabled={saving}>
            {saving ? "Menyimpan..." : "Tambah Data Test"}
          </button>
        </div>

        {message && (
          <p
            style={{
              padding: "12px",
              background: "#e2e8f0",
              borderRadius: "8px",
            }}
          >
            {message}
          </p>
        )}

        {loading ? (
          <p>Memuat data...</p>
        ) : rows.length === 0 ? (
          <p>Belum ada data.</p>
        ) : (
          <div
            style={{
              overflowX: "auto",
              background: "#ffffff",
              borderRadius: "12px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Unit</th>
                  <th>Cadeb</th>
                  <th>Plafond</th>
                  <th>Fresh Money</th>
                  <th>Produk</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.unit}</td>
                    <td>{row.cadeb}</td>
                    <td>{row.plafond}</td>
                    <td>{row.fresh_money}</td>
                    <td>{row.produk}</td>

                    <td>
                      <button type="button" onClick={() => handleDelete(row.id)}>
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

export default DatabaseTest;
