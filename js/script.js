const TARIF_KAS = 5000;

const KEY_SISWA = "uang_kas_siswa";
const KEY_TRANSAKSI = "uang_kas_transaksi";

let dataSiswa = JSON.parse(
    localStorage.getItem(KEY_SISWA) || "[]"
);

let dataTransaksi = JSON.parse(
    localStorage.getItem(KEY_TRANSAKSI) || "[]"
);

// FORMAT RUPIAH
function rupiah(angka) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(angka);
}

// TANGGAL
function tanggalHariIni() {
    return new Date().toLocaleDateString("id-ID");
}

// SIMPAN DATA
function simpanData() {
    localStorage.setItem(
        KEY_SISWA,
        JSON.stringify(dataSiswa)
    );

    localStorage.setItem(
        KEY_TRANSAKSI,
        JSON.stringify(dataTransaksi)
    );
}

// AMANKAN TEKS
function aman(teks) {
    return String(teks).replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[c]);
}

// DASHBOARD
function renderDashboard() {
    let pemasukan = 0;
    let pengeluaran = 0;

    dataTransaksi.forEach(t => {
        if (t.jenis === "Pemasukan") {
            pemasukan += t.nominal;
        } else {
            pengeluaran += t.nominal;
        }
    });

    document.getElementById("pemasukan").textContent =
        rupiah(pemasukan);

    document.getElementById("pengeluaranTotal").textContent =
        rupiah(pengeluaran);

    document.getElementById("saldo").textContent =
        rupiah(pemasukan - pengeluaran);

    document.getElementById("jumlahSiswa").textContent =
        dataSiswa.length;
}

// TAMPILKAN SISWA
function renderSiswa() {
    const tbody = document.getElementById("daftarSiswa");

    if (dataSiswa.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">Belum ada data siswa.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = dataSiswa.map((s, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${aman(s.nama)}</td>
            <td>${aman(s.kelas)}</td>
            <td>
                <span class="status ${s.lunas ? "lunas" : ""}">
                    ${s.lunas ? "Sudah bayar" : "Belum bayar"}
                </span>
            </td>
            <td>
                ${
                    s.lunas
                    ? "Lunas"
                    : `<button class="aksi bayar"
                        onclick="bayarKas('${s.id}')">
                        Bayar
                       </button>`
                }

                <button class="aksi hapus"
                    onclick="hapusSiswa('${s.id}')">
                    Hapus
                </button>
            </td>
        </tr>
    `).join("");
}

// RIWAYAT TRANSAKSI
function renderRiwayat() {
    const tbody = document.getElementById("daftarRiwayat");

    if (dataTransaksi.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">Belum ada transaksi.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = [...dataTransaksi].reverse().map(t => `
        <tr>
            <td>${aman(t.tanggal)}</td>
            <td>${aman(t.jenis)}</td>
            <td>${aman(t.keterangan)}</td>
            <td>${rupiah(t.nominal)}</td>
        </tr>
    `).join("");
}

// TAMPILKAN SEMUA
function renderSemua() {
    renderDashboard();
    renderSiswa();
    renderRiwayat();
}

// TAMBAH SISWA
document.getElementById("formSiswa")
.addEventListener("submit", function(e) {
    e.preventDefault();

    const nama =
        document.getElementById("nama").value.trim();

    const kelas =
        document.getElementById("kelas").value;

    const kelasValid = [
        "RPL 1", "RPL 2", "RPL 3",
        "TSM 1", "TSM 2", "TSM 3",
        "MP 1", "MP 2", "MP 3"
    ];

    if (!nama || !kelasValid.includes(kelas)) {
        alert("Masukkan nama dan pilih kelas yang benar!");
        return;
    }

    dataSiswa.push({
        id: Date.now().toString() +
            Math.random().toString(16).slice(2),
        nama: nama,
        kelas: kelas,
        lunas: false
    });

    simpanData();
    renderSemua();
    this.reset();

    alert("Siswa berhasil ditambahkan!");
});

// BAYAR KAS
function bayarKas(id) {
    const siswa = dataSiswa.find(s => s.id === id);

    if (!siswa || siswa.lunas) return;

    if (!confirm(
        "Catat pembayaran Rp5.000 dari " + siswa.nama + "?"
    )) {
        return;
    }

    siswa.lunas = true;

    dataTransaksi.push({
        tanggal: tanggalHariIni(),
        jenis: "Pemasukan",
        keterangan:
            "Kas " + siswa.nama + " - " + siswa.kelas,
        nominal: TARIF_KAS
    });

    simpanData();
    renderSemua();

    alert("Pembayaran berhasil dicatat!");
}

// HAPUS SISWA
function hapusSiswa(id) {
    const siswa = dataSiswa.find(s => s.id === id);

    if (!siswa) return;

    if (!confirm("Hapus data siswa " + siswa.nama + "?")) {
        return;
    }

    dataSiswa = dataSiswa.filter(s => s.id !== id);

    simpanData();
    renderSemua();
}

// PENGELUARAN
document.getElementById("formPengeluaran")
.addEventListener("submit", function(e) {
    e.preventDefault();

    const keterangan =
        document.getElementById("keterangan").value.trim();

    const nominal =
        Number(document.getElementById("nominal").value);

    if (
        !keterangan ||
        !Number.isSafeInteger(nominal) ||
        nominal <= 0
    ) {
        alert("Masukkan keterangan dan nominal dengan benar!");
        return;
    }

    const saldo = dataTransaksi.reduce((total, t) => {
        return total + (
            t.jenis === "Pemasukan"
            ? t.nominal
            : -t.nominal
        );
    }, 0);

    if (nominal > saldo) {
        alert("Saldo kas tidak mencukupi!");
        return;
    }

    dataTransaksi.push({
        tanggal: tanggalHariIni(),
        jenis: "Pengeluaran",
        keterangan: keterangan,
        nominal: nominal
    });

    simpanData();
    renderSemua();
    this.reset();

    alert("Pengeluaran berhasil disimpan!");
});

// JALANKAN WEBSITE
renderSemua();
      
