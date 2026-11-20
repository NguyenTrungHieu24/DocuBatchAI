// DocuBatch - Frontend Application Logic

const DEFAULT_TEMPLATES = {


  land_record: {
    name: "🗺️ Thông tin thửa đất / BĐĐC",
    fields: [
      {id: "stt", label: "STT", description: "Số thứ tự"},
      {id: "ten_chu_su_dung_dat_1", label: "Tên chủ sử dụng đất 1", description: "Họ và tên chủ sử dụng đất thứ nhất"},
      {id: "cccd_1", label: "CCCD 1", description: "Số CCCD/CMND của chủ sử dụng đất 1"},
      {id: "ten_chu_su_dung_dat_2", label: "Tên chủ sử dụng đất 2", description: "Họ và tên chủ sử dụng đất thứ hai"},
      {id: "cccd_2", label: "CCCD 2", description: "Số CCCD/CMND của chủ sử dụng đất 2"},
      {id: "dia_chi_thuong_tru", label: "Địa chỉ thường trú", description: "Địa chỉ thường trú của chủ sở hữu"},
      {id: "so_hieu_to_bddc_2_cap", label: "Số hiệu tờ BĐĐC 2 cấp", description: "Số hiệu tờ bản đồ địa chính 2 cấp"},
      {
        id: "so_thu_tu_thua_bddc_2_cap",
        label: "Số thứ tự thửa BĐĐC 2 cấp",
        description: "Số thứ tự thửa đất trên bản đồ địa chính 2 cấp"
      },
      {id: "dien_tich", label: "Diện tích", description: "Diện tích thửa đất, thay dấu phẩy bằng dấu chấm và bỏ đơn vị diện tích "},
      {id: "muc_dich", label: "Mục đích", description: "Mục đích sử dụng đất"},
      {id: "dia_chi_thua_dat", label: "Địa chỉ thửa đất", description: "Địa chỉ/Vị trí của thửa đất"},
      {id: "thoi_han", label: "Thời hạn", description: "Thời hạn sử dụng đất"},
      {id: "thoi_diem_su_dung", label: "Thời điểm sử dụng", description: "Thời điểm bắt đầu sử dụng đất"},
      {id: "nguon_goc", label: "Nguồn gốc", description: "Nguồn gốc sử dụng đất"}
    ]
  },
  land_cover: {
    name: "📕 Bìa giấy chứng nhận quyền sử dụng đất",
    fields: [
      { id: "ma_bia", label: "Mã Bìa", description: "Mã bìa hoặc mã hồ sơ in trên giấy chứng nhận; để trống nếu không thấy" },
      { id: "to_so", label: "Tờ số", description: "Số hiệu tờ bản đồ địa chính" },
      { id: "thua_dat", label: "Thửa đất", description: "Số thửa đất ghi trên giấy chứng nhận" },
      { id: "dien_tich", label: "Diện tích", description: "Diện tích thửa đất, thay dấu phẩy bằng dấu chấm và bỏ đơn vị diện tích " },
      { id: "muc_dich", label: "Mục Đích", description: "Mục đích sử dụng đất ghi trên giấy chứng nhận" }
    ]
  },
  order: {
    name: "📦 Đơn đặt hàng / Giao hàng",
    fields: [
      { id: "ma_don_hang", label: "Mã đơn hàng", description: "Mã phiếu hoặc số PO" },
      { id: "ngay_dat", label: "Ngày đặt", description: "Ngày lập đơn" },
      { id: "nha_cung_cap", label: "Nhà cung cấp", description: "Đơn vị bán / cung ứng" },
      { id: "nguoi_nhan", label: "Người nhận / Địa chỉ", description: "Tên người nhận và địa chỉ giao hàng" },
      { id: "tong_gia_tri", label: "Tổng giá trị", description: "Tổng số tiền đơn hàng" }
    ]
  },

  custom: {
    name: "⚙️ Mẫu tùy chỉnh",
    fields: [
      { id: "tieu_de", label: "Tiêu đề", description: "Tiêu đề tài liệu" },
      { id: "ngay_thang", label: "Ngày tháng", description: "Ngày liên quan" },
      { id: "noi_dung_chinh", label: "Nội dung chính", description: "Tóm lược nội dung" }
    ]
  },
};

const CUSTOM_SCHEMA_STORAGE_KEY = "docubatch_custom_schema";

function loadCustomSchema() {
  const fallback = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES.custom));
  const stored = localStorage.getItem(CUSTOM_SCHEMA_STORAGE_KEY);
  if (!stored) return fallback;

  try {
    const schema = JSON.parse(stored);
    if (
      typeof schema.name !== "string" ||
      !Array.isArray(schema.fields) ||
      !schema.fields.every(field =>
        field &&
        typeof field.id === "string" &&
        typeof field.label === "string" &&
        (field.description === undefined || typeof field.description === "string")
      )
    ) {
      return fallback;
    }
    return schema;
  } catch (error) {
    console.warn("Không thể đọc biểu mẫu tùy chỉnh đã lưu.", error);
    return fallback;
  }
}

// Global Application State
const state = {
  currentTemplateKey: "land_record",
  activeSchema: JSON.parse(JSON.stringify(DEFAULT_TEMPLATES.land_record)),
  customSchema: loadCustomSchema(),
  fileQueue: [], // { id, file, status: 'queued'|'processing'|'completed'|'error', errorMsg, result }
  processedRecords: [], // array of completed records
  currentlyReviewingId: null,
  apiKeyAvailable: null,
  model: localStorage.getItem("docubatch_model") || "auto",
  isProcessing: false
};

localStorage.removeItem("docubatch_api_key");

// DOM Elements
const el = {
  templateSelect: document.getElementById("templateSelect"),
  schemaTagsList: document.getElementById("schemaTagsList"),
  btnOpenSchemaModal: document.getElementById("btnOpenSchemaModal"),
  dropZone: document.getElementById("dropZone"),
  fileInput: document.getElementById("fileInput"),
  fileQueueContainer: document.getElementById("fileQueueContainer"),
  emptyQueueMsg: document.getElementById("emptyQueueMsg"),
  queueCounter: document.getElementById("queueCounter"),
  btnClearQueue: document.getElementById("btnClearQueue"),
  btnStartBatch: document.getElementById("btnStartBatch"),
  batchProgressSummary: document.getElementById("batchProgressSummary"),
  tableHeaderRow: document.getElementById("tableHeaderRow"),
  tableBody: document.getElementById("tableBody"),
  btnExportExcel: document.getElementById("btnExportExcel"),
  btnClearTable: document.getElementById("btnClearTable"),

  // Settings Modal
  settingsModal: document.getElementById("settingsModal"),
  btnOpenSettings: document.getElementById("btnOpenSettings"),
  btnCloseSettings: document.getElementById("btnCloseSettings"),
  btnSaveSettings: document.getElementById("btnSaveSettings"),
  selectModel: document.getElementById("selectModel"),
  apiKeyIndicator: document.getElementById("apiKeyIndicator"),
  apiKeyText: document.getElementById("apiKeyText"),

  // Schema Modal
  schemaModal: document.getElementById("schemaModal"),
  btnCloseSchemaModal: document.getElementById("btnCloseSchemaModal"),
  schemaNameInput: document.getElementById("schemaNameInput"),
  schemaFieldsEditorList: document.getElementById("schemaFieldsEditorList"),
  btnAddFieldBtn: document.getElementById("btnAddFieldBtn"),
  btnSaveSchemaBtn: document.getElementById("btnSaveSchemaBtn"),

  // Review Modal
  reviewModal: document.getElementById("reviewModal"),
  btnCloseReviewModal: document.getElementById("btnCloseReviewModal"),
  reviewModalTitle: document.getElementById("reviewModalTitle"),
  viewerFilename: document.getElementById("viewerFilename"),
  btnOpenRawFile: document.getElementById("btnOpenRawFile"),
  documentViewerContainer: document.getElementById("documentViewerContainer"),
  reviewFormFields: document.getElementById("reviewFormFields"),
  reviewConfidenceBadge: document.getElementById("reviewConfidenceBadge"),
  reviewAiSummary: document.getElementById("reviewAiSummary"),
  btnToggleVerify: document.getElementById("btnToggleVerify"),
  btnVerifyText: document.getElementById("btnVerifyText"),
  btnSaveReviewForm: document.getElementById("btnSaveReviewForm"),

  toastContainer: document.getElementById("toastContainer")
};

// ================= INITIALIZATION =================
async function init() {
  updateApiKeyStatusUI();
  renderSchemaTags();
  renderTableHeader();
  setupEventListeners();
  try {
    const response = await fetch("/api/config");
    if (!response.ok) throw new Error("Không thể kiểm tra cấu hình máy chủ.");
    const config = await response.json();
    if (typeof config.gemini_api_key_configured !== "boolean") {
      throw new Error("Cấu hình máy chủ trả về dữ liệu không hợp lệ.");
    }
    state.apiKeyAvailable = config.gemini_api_key_configured;
  } catch (error) {
    console.error(error);
    state.apiKeyAvailable = null;
  }
  updateApiKeyStatusUI();
}

function updateApiKeyStatusUI() {
  if (state.apiKeyAvailable) {
    document.getElementById("apiKeyLogo").classList.remove("hidden");
    el.apiKeyIndicator.className = "w-2 h-2 rounded-full bg-emerald-500";
    el.apiKeyIndicator.classList.add("hidden");
    el.apiKeyText.innerText = "AI đã sẵn sàng";
  } else if (state.apiKeyAvailable === false) {
    document.getElementById("apiKeyLogo").classList.add("hidden");
    el.apiKeyIndicator.classList.remove("hidden");
    el.apiKeyIndicator.className = "w-2 h-2 rounded-full bg-amber-400 animate-pulse";
    el.apiKeyText.innerText = "Chưa cấu hình API Key trên máy chủ";
  } else {
    document.getElementById("apiKeyLogo").classList.add("hidden");
    el.apiKeyIndicator.classList.remove("hidden");
    el.apiKeyIndicator.className = "w-2 h-2 rounded-full bg-red-500";
    el.apiKeyText.innerText = "Không kiểm tra được cấu hình máy chủ";
  }
}

// ================= SCHEMA & TEMPLATE HANDLING =================
function renderSchemaTags() {
  el.schemaTagsList.innerHTML = "";
  state.activeSchema.fields.forEach((field) => {
    const tag = document.createElement("span");
    tag.className = "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200";
    tag.innerHTML = `<i class="fa-solid fa-tag text-[10px] text-brand-600 mr-1.5"></i> ${escapeHtml(field.label)}`;
    el.schemaTagsList.appendChild(tag);
  });
}

function renderTableHeader() {
  // Clear dynamic headers
  el.tableHeaderRow.innerHTML = `
    <th class="p-3 w-12 text-center">STT</th>
    <th class="p-3 w-44">Tài liệu</th>
  `;

  // Add schema fields as columns
  state.activeSchema.fields.forEach((f) => {
    const th = document.createElement("th");
    th.className = "p-3 font-semibold";
    th.innerText = f.label;
    el.tableHeaderRow.appendChild(th);
  });

  // End headers
  const thSummary = document.createElement("th");
  thSummary.className = "p-3 w-48";
  thSummary.innerText = "Tóm tắt AI";
  el.tableHeaderRow.appendChild(thSummary);

  const thStatus = document.createElement("th");
  thStatus.className = "p-3 w-28 text-center";
  thStatus.innerText = "Đối soát";
  el.tableHeaderRow.appendChild(thStatus);

  const thAction = document.createElement("th");
  thAction.className = "p-3 w-24 text-center";
  thAction.innerText = "Thao tác";
  el.tableHeaderRow.appendChild(thAction);

  renderTableBody();
}

function renderTableBody() {
  if (state.processedRecords.length === 0) {
    const colCount = state.activeSchema.fields.length + 5;
    el.tableBody.innerHTML = `
      <tr>
        <td colspan="${colCount}" class="p-8 text-center text-slate-400">
          Chưa có dữ liệu nào được trích xuất.
        </td>
      </tr>
    `;
    return;
  }

  el.tableBody.innerHTML = "";
  state.processedRecords.forEach((record, index) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50/80 transition cursor-pointer";

    // STT
    let rowHtml = `<td class="p-3 text-center text-slate-400 font-mono">${index + 1}</td>`;

    // Filename
    rowHtml += `
      <td class="p-3 font-medium text-slate-900 flex items-center space-x-2">
        <i class="fa-solid fa-file-lines text-brand-600"></i>
        <span class="truncate max-w-[150px]" title="${escapeHtml(record.filename)}">${escapeHtml(record.filename)}</span>
        ${record.totalRowsInFile > 1 ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">#${record.rowIndex}</span>` : ''}
      </td>
    `;

    // Extracted Fields values
    const data = record.extractedData || {};
    state.activeSchema.fields.forEach((f) => {
      const val = data[f.id] || "";
      rowHtml += `<td class="p-3 text-slate-600 max-w-[150px] truncate" title="${escapeHtml(val)}">${escapeHtml(val) || '<span class="text-slate-300">-</span>'}</td>`;
    });

    // Summary
    const summary = data._ai_summary || "Không có tóm tắt";
    rowHtml += `<td class="p-3 text-slate-500 max-w-[180px] truncate italic" title="${escapeHtml(summary)}">${escapeHtml(summary)}</td>`;

    // Verification Status
    const isVerified = record.verified;
    const badgeHtml = isVerified
      ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800"><i class="fa-solid fa-check mr-1"></i> Đã duyệt</span>`
      : `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800"><i class="fa-solid fa-clock mr-1"></i> Chưa duyệt</span>`;
    rowHtml += `<td class="p-3 text-center">${badgeHtml}</td>`;

    // Actions
    rowHtml += `
      <td class="p-3 text-center">
        <div class="flex items-center justify-center space-x-1" onclick="event.stopPropagation()">
          <button class="p-1.5 text-brand-600 hover:bg-brand-50 rounded" title="Đối soát & Chỉnh sửa" onclick="openReviewModal('${record.id}')">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="p-1.5 text-rose-500 hover:bg-rose-50 rounded" title="Xóa" onclick="deleteRecord('${record.id}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;

    tr.innerHTML = rowHtml;
    tr.addEventListener("click", () => openReviewModal(record.id));
    el.tableBody.appendChild(tr);
  });
}

// ================= FILE QUEUE & UPLOAD =================
function handleFilesAdded(files) {
  const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
  let addedCount = 0;

  for (let file of files) {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (allowed.includes(ext)) {
      const item = {
        id: "file_" + Math.random().toString(36).substr(2, 9),
        file: file,
        status: "queued", // 'queued', 'processing', 'completed', 'error'
        errorMsg: null,
        result: null
      };
      state.fileQueue.push(item);
      addedCount++;
    } else {
      showToast(`Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận PDF và Ảnh.`, "warning");
    }
  }

  if (addedCount > 0) {
    renderFileQueueUI();
  }
}

function renderFileQueueUI() {
  const q = state.fileQueue;
  el.queueCounter.innerText = `Đã chọn: ${q.length} file`;
  el.btnClearQueue.classList.toggle("hidden", q.length === 0);

  if (q.length === 0) {
    el.emptyQueueMsg.classList.remove("hidden");
    el.batchProgressSummary.innerText = "Chưa có tác vụ";
    return;
  }

  el.emptyQueueMsg.classList.add("hidden");

  // Keep existing items or rerender
  el.fileQueueContainer.innerHTML = "";
  q.forEach((item) => {
    const row = document.createElement("div");
    row.className = "py-2.5 px-3 flex items-center justify-between hover:bg-slate-50 rounded-lg text-xs";
    row.id = `queue_item_${item.id}`;

    let statusBadge = "";
    if (item.status === "queued") {
      statusBadge = `<span class="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 font-medium">Chờ xử lý</span>`;
    } else if (item.status === "processing") {
      statusBadge = `<span class="px-2 py-0.5 rounded text-[11px] bg-blue-100 text-brand-700 font-medium flex items-center"><i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Đang đọc AI...</span>`;
    } else if (item.status === "completed") {
      statusBadge = `<span class="px-2 py-0.5 rounded text-[11px] bg-emerald-100 text-emerald-700 font-medium flex items-center"><i class="fa-solid fa-check mr-1"></i> Xong</span>`;
    } else if (item.status === "error") {
      statusBadge = `<span class="px-2 py-0.5 rounded text-[11px] bg-rose-100 text-rose-700 font-medium flex items-center" title="${escapeHtml(item.errorMsg || 'Lỗi')}"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Lỗi</span>`;
    }

    const fileSizeStr = (item.file.size / (1024 * 1024)).toFixed(2) + " MB";

    row.innerHTML = `
      <div class="flex items-center space-x-2.5 min-w-0 pr-2">
        <i class="fa-solid ${item.file.type.includes('pdf') ? 'fa-file-pdf text-rose-500' : 'fa-file-image text-blue-500'} text-base"></i>
        <div class="truncate">
          <p class="font-medium text-slate-800 truncate">${escapeHtml(item.file.name)}</p>
          <p class="text-[10px] text-slate-400">${fileSizeStr}</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        ${statusBadge}
        ${item.status === 'queued' ? `<button class="text-slate-400 hover:text-rose-500 p-1" onclick="removeQueueItem('${item.id}')"><i class="fa-solid fa-xmark"></i></button>` : ''}
      </div>
    `;

    el.fileQueueContainer.appendChild(row);
  });

  const completedCount = q.filter(i => i.status === "completed").length;
  el.batchProgressSummary.innerText = `Đã hoàn thành ${completedCount}/${q.length}`;
}

window.removeQueueItem = function(id) {
  state.fileQueue = state.fileQueue.filter(i => i.id !== id);
  state.processedRecords = state.processedRecords.filter(r => r.fileQueueId !== id && r.id !== id);
  renderFileQueueUI();
  renderTableBody();
};

// ================= BATCH PROCESSING =================
async function startBatchExtraction() {
  if (!state.apiKeyAvailable) {
    const message = state.apiKeyAvailable === false
      ? "Hãy cấu hình GEMINI_API_KEY trong file .env trên máy chủ trước khi bắt đầu."
      : "Không thể kiểm tra cấu hình máy chủ. Vui lòng tải lại trang.";
    showToast(message, "warning");
    openSettingsModal();
    return;
  }

  const queuedItems = state.fileQueue.filter(i => i.status === "queued" || i.status === "error");
  if (queuedItems.length === 0) {
    showToast("Không có file nào trong hàng chờ.", "info");
    return;
  }

  state.isProcessing = true;
  el.btnStartBatch.disabled = true;
  el.btnStartBatch.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang xử lý tài liệu...`;

  showToast(`Bắt đầu xử lý ${queuedItems.length} tài liệu...`, "info");

  // Xử lý từng file (hoặc tối đa 2 file cùng lúc để mượt mà)
  for (let item of queuedItems) {
    item.status = "processing";
    renderFileQueueUI();

    try {
      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("schema_json", JSON.stringify(state.activeSchema));
      formData.append("model", state.model || "auto");

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        throw new Error(resData.detail || resData.error || "Không thể trích xuất tài liệu");
      }

      item.status = "completed";
      item.result = resData;

      // Xử lý các dòng dữ liệu (items) trích xuất được
      const rawData = resData.extracted_data || {};
      const summary = rawData._ai_summary || "Không có tóm tắt";
      const confidence = rawData._confidence_score || 0.95;

      let rowsData = [];
      if (Array.isArray(rawData.items) && rawData.items.length > 0) {
        rowsData = rawData.items;
      } else if (Array.isArray(rawData) && rawData.length > 0) {
        rowsData = rawData;
      } else {
        rowsData = [rawData];
      }

      // Loại bỏ các bản ghi cũ của tệp này (nếu đang xử lý lại)
      state.processedRecords = state.processedRecords.filter(r => r.fileQueueId !== item.id && r.id !== item.id);

      const totalRows = rowsData.length;
      rowsData.forEach((row, rowIdx) => {
        const rowExtracted = { ...row };
        rowExtracted._ai_summary = summary;
        rowExtracted._confidence_score = confidence;

        const record = {
          id: `${item.id}_${rowIdx}`,
          fileQueueId: item.id,
          rawFilename: item.file.name,
          filename: totalRows > 1 ? `${item.file.name} (dòng ${rowIdx + 1})` : item.file.name,
          rowIndex: rowIdx + 1,
          totalRowsInFile: totalRows,
          fileUrl: resData.file_url,
          fileType: resData.content_type,
          extractedData: rowExtracted,
          verified: false,
          timestamp: new Date().toISOString()
        };

        state.processedRecords.push(record);
      });

    } catch (err) {
      console.error(err);
      item.status = "error";
      item.errorMsg = err.message;
      showToast(`Lỗi xử lý "${item.file.name}": ${err.message}`, "error");
    }

    renderFileQueueUI();
    renderTableBody();
  }

  state.isProcessing = false;
  el.btnStartBatch.disabled = false;
  el.btnStartBatch.innerHTML = `<i class="fa-solid fa-bolt mr-2"></i> Bắt đầu Trích xuất AI`;
  showToast("Quá trình trích xuất hoàn tất!", "success");
}

// ================= SPLIT-SCREEN REVIEW =================
window.openReviewModal = function(recordId) {
  const record = state.processedRecords.find(r => r.id === recordId);
  if (!record) return;

  state.currentlyReviewingId = recordId;
  el.reviewModalTitle.innerText = record.filename;
  el.viewerFilename.innerText = record.filename;
  el.btnOpenRawFile.href = record.fileUrl;

  // Render Viewer (Iframe for PDF, img for images)
  el.documentViewerContainer.innerHTML = "";
  if (record.fileType.includes("pdf")) {
    const iframe = document.createElement("iframe");
    iframe.src = record.fileUrl;
    iframe.className = "w-full h-full border-0 rounded-lg bg-white";
    el.documentViewerContainer.appendChild(iframe);
  } else {
    const img = document.createElement("img");
    img.src = record.fileUrl;
    img.className = "max-w-full max-h-full object-contain rounded-lg shadow-sm";
    el.documentViewerContainer.appendChild(img);
  }

  // Summary & Confidence
  const extracted = record.extractedData || {};
  el.reviewAiSummary.innerText = extracted._ai_summary || "Không có tóm tắt tự động";
  const confidence = extracted._confidence_score ? Math.round(extracted._confidence_score * 100) : 95;
  el.reviewConfidenceBadge.innerText = `Độ tin cậy: ${confidence}%`;

  // Render Editable Form Fields
  el.reviewFormFields.innerHTML = "";
  state.activeSchema.fields.forEach((field) => {
    const fieldVal = extracted[field.id] || "";

    const fieldGroup = document.createElement("div");
    fieldGroup.className = "space-y-1";
    fieldGroup.innerHTML = `
      <label class="block text-xs font-semibold text-slate-700">
        ${escapeHtml(field.label)}
        ${field.description ? `<span class="font-normal text-[11px] text-slate-400 ml-1">(${escapeHtml(field.description)})</span>` : ''}
      </label>
      <input type="text" data-field-id="${field.id}" value="${escapeHtml(fieldVal)}"
        class="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white">
    `;
    el.reviewFormFields.appendChild(fieldGroup);
  });

  // Verify Button State
  updateVerifyButtonUI(record.verified);

  el.reviewModal.classList.remove("hidden");
};

function updateVerifyButtonUI(isVerified) {
  if (isVerified) {
    el.btnToggleVerify.className = "px-3.5 py-1.5 rounded-lg text-xs font-medium border border-emerald-500 bg-emerald-50 text-emerald-700 flex items-center space-x-1.5 transition";
    el.btnVerifyText.innerText = "Đã đối soát ✓";
  } else {
    el.btnToggleVerify.className = "px-3.5 py-1.5 rounded-lg text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 transition";
    el.btnVerifyText.innerText = "Đánh dấu đã đối soát";
  }
}

function saveReviewForm() {
  if (!state.currentlyReviewingId) return;
  const record = state.processedRecords.find(r => r.id === state.currentlyReviewingId);
  if (!record) return;

  const inputs = el.reviewFormFields.querySelectorAll("input[data-field-id]");
  inputs.forEach(input => {
    const fid = input.getAttribute("data-field-id");
    record.extractedData[fid] = input.value.trim();
  });

  renderTableBody();
  showToast("Đã lưu các thay đổi!", "success");
}

function toggleVerifyCurrent() {
  if (!state.currentlyReviewingId) return;
  const record = state.processedRecords.find(r => r.id === state.currentlyReviewingId);
  if (!record) return;

  record.verified = !record.verified;
  updateVerifyButtonUI(record.verified);
  renderTableBody();
  showToast(record.verified ? "Đã xác nhận đối soát" : "Đã hủy đối soát", "info");
}

window.deleteRecord = function(recordId) {
  if (!confirm("Bạn có chắc muốn xóa tài liệu này khỏi bảng?")) return;
  state.processedRecords = state.processedRecords.filter(r => r.id !== recordId);
  renderTableBody();
  showToast("Đã xóa tài liệu.", "info");
};

// ================= EXPORT =================
async function exportToExcel() {
  if (state.processedRecords.length === 0) {
    showToast("Không có dữ liệu để xuất Excel.", "warning");
    return;
  }

  try {
    el.btnExportExcel.disabled = true;
    el.btnExportExcel.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Đang xuất...`;

    const res = await fetch("/api/export/excel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        records: state.processedRecords,
        schema_fields: state.activeSchema.fields
      })
    });

    if (!res.ok) throw new Error("Xuất Excel thất bại.");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DocuBatch_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast("Đã tải xuống file Excel thành công!", "success");
  } catch (err) {
    console.error(err);
    showToast("Lỗi khi xuất file Excel.", "error");
  } finally {
    el.btnExportExcel.disabled = false;
    el.btnExportExcel.innerHTML = `<i class="fa-solid fa-file-excel mr-1.5"></i> Xuất file Excel (.xlsx)`;
  }
}


// ================= SCHEMA MODAL =================
function openSchemaModal() {
  renderSchemaEditorList();
  el.schemaModal.classList.remove("hidden");
}

function renderSchemaEditorList() {
  if (el.schemaNameInput) el.schemaNameInput.value = state.activeSchema.name || "";
  el.schemaFieldsEditorList.innerHTML = "";
  state.activeSchema.fields.forEach((field, index) => {
    const row = document.createElement("div");
    row.className = "flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs";
    row.innerHTML = `
      <div class="flex-1 grid grid-cols-2 gap-2">
        <input type="text" value="${escapeHtml(field.label)}" placeholder="Tên trường (hiển thị)" data-index="${index}" data-prop="label"
          class="p-2 border border-slate-300 rounded bg-white font-medium focus:ring-1 focus:ring-brand-500">
        <input type="text" value="${escapeHtml(field.description || '')}" placeholder="Gợi ý nội dung cho AI" data-index="${index}" data-prop="description"
          class="p-2 border border-slate-300 rounded bg-white text-slate-500 focus:ring-1 focus:ring-brand-500">
      </div>
      <button class="p-2 text-rose-500 hover:bg-rose-50 rounded" onclick="removeSchemaField(${index})">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    el.schemaFieldsEditorList.appendChild(row);
  });
}

window.removeSchemaField = function(index) {
  syncSchemaEditor();
  state.activeSchema.fields.splice(index, 1);
  renderSchemaEditorList();
};

function addSchemaField() {
  syncSchemaEditor();
  const newIndex = state.activeSchema.fields.length + 1;
  let fieldId = `truong_moi_${newIndex}`;
  let suffix = newIndex;
  while (state.activeSchema.fields.some(field => field.id === fieldId)) {
    fieldId = `truong_moi_${++suffix}`;
  }
  state.activeSchema.fields.push({
    id: fieldId,
    label: `Trường mới ${suffix}`,
    description: ""
  });
  renderSchemaEditorList();
}

function syncSchemaEditor() {
  if (el.schemaNameInput) state.activeSchema.name = el.schemaNameInput.value;
  const inputs = el.schemaFieldsEditorList.querySelectorAll("input[data-index]");
  inputs.forEach(input => {
    const idx = Number(input.getAttribute("data-index"));
    const prop = input.getAttribute("data-prop");
    if (state.activeSchema.fields[idx]) {
      state.activeSchema.fields[idx][prop] = input.value;
      if (prop === "label" && !state.activeSchema.fields[idx].id) {
        state.activeSchema.fields[idx].id = "field_" + idx;
      }
    }
  });
}

function saveSchemaCustomization() {
  syncSchemaEditor();
  state.activeSchema.name = state.activeSchema.name.trim() || DEFAULT_TEMPLATES.custom.name;
  state.activeSchema.fields.forEach(field => {
    field.label = field.label.trim();
    field.description = (field.description || "").trim();
  });

  // Chuyển template select sang custom
  el.templateSelect.value = "custom";
  state.currentTemplateKey = "custom";
  state.customSchema = JSON.parse(JSON.stringify(state.activeSchema));
  try {
    localStorage.setItem(CUSTOM_SCHEMA_STORAGE_KEY, JSON.stringify(state.customSchema));
  } catch (error) {
    showToast("Không thể lưu biểu mẫu vào trình duyệt. Vui lòng kiểm tra dung lượng lưu trữ.", "error");
    return;
  }
  renderSchemaTags();
  renderTableHeader();
  el.schemaModal.classList.add("hidden");
  showToast("Đã cập nhật các trường trích xuất!", "success");
}

// ================= SETTINGS =================
function openSettingsModal() {
  el.selectModel.value = state.model;
  el.settingsModal.classList.remove("hidden");
}

function saveSettings() {
  const model = el.selectModel.value;

  state.model = model;

  localStorage.setItem("docubatch_model", model);

  el.settingsModal.classList.add("hidden");
  showToast("Đã lưu cấu hình mô hình AI!", "success");
}

// ================= TOAST NOTIFICATION =================
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `p-3 rounded-xl shadow-lg border text-xs font-medium flex items-center space-x-2 animate-fade-in pointer-events-auto ${
    type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
    type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
    type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
    'bg-slate-900 border-slate-800 text-white'
  }`;

  const icon = type === 'success' ? 'fa-circle-check text-emerald-600' :
               type === 'error' ? 'fa-circle-xmark text-rose-600' :
               type === 'warning' ? 'fa-triangle-exclamation text-amber-500' :
               'fa-circle-info text-blue-400';

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
  el.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// ================= EVENT LISTENERS =================
function setupEventListeners() {
  // Template Select
  el.templateSelect.addEventListener("change", (e) => {
    const key = e.target.value;
    state.currentTemplateKey = key;
    state.activeSchema = JSON.parse(JSON.stringify(
      key === "custom" ? state.customSchema : DEFAULT_TEMPLATES[key]
    ));
    renderSchemaTags();
    renderTableHeader();
  });

  // Schema Modal
  el.btnOpenSchemaModal.addEventListener("click", openSchemaModal);
  el.btnCloseSchemaModal.addEventListener("click", () => el.schemaModal.classList.add("hidden"));
  el.btnAddFieldBtn.addEventListener("click", addSchemaField);
  el.btnSaveSchemaBtn.addEventListener("click", saveSchemaCustomization);

  // Drag and Drop
  el.dropZone.addEventListener("click", () => el.fileInput.click());
  el.fileInput.addEventListener("change", (e) => {
    if (e.target.files.length) handleFilesAdded(Array.from(e.target.files));
    el.fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach(eventName => {
    el.dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      el.dropZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach(eventName => {
    el.dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      el.dropZone.classList.remove("dragover");
    });
  });

  el.dropZone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files.length) {
      handleFilesAdded(Array.from(dt.files));
    }
  });

  el.btnClearQueue.addEventListener("click", () => {
    state.fileQueue = [];
    renderFileQueueUI();
  });

  // Batch Start
  el.btnStartBatch.addEventListener("click", startBatchExtraction);

  // Settings
  el.btnOpenSettings.addEventListener("click", openSettingsModal);
  el.btnCloseSettings.addEventListener("click", () => el.settingsModal.classList.add("hidden"));
  el.btnSaveSettings.addEventListener("click", saveSettings);

  // Review Modal
  el.btnCloseReviewModal.addEventListener("click", () => el.reviewModal.classList.add("hidden"));
  el.btnSaveReviewForm.addEventListener("click", saveReviewForm);
  el.btnToggleVerify.addEventListener("click", toggleVerifyCurrent);

  // Export
  el.btnExportExcel.addEventListener("click", exportToExcel);

  // Clear Table
  if (el.btnClearTable) {
    el.btnClearTable.addEventListener("click", () => {
      if (state.processedRecords.length === 0) return;
      if (confirm("Bạn có chắc chắn muốn xóa toàn bộ các dòng trong bảng kết quả?")) {
        state.processedRecords = [];
        renderTableBody();
        showToast("Đã xóa toàn bộ dữ liệu bảng.", "info");
      }
    });
  }
}

// Start
document.addEventListener("DOMContentLoaded", init);

// ================= CAMERA CAPTURE =================
(function() {
  let cameraStream = null;
  let facingMode = "environment"; // 'environment' = back cam, 'user' = front cam
  let hasCaptured = false;

  const modal           = document.getElementById("cameraModal");
  const video           = document.getElementById("cameraVideo");
  const canvas          = document.getElementById("cameraCanvas");
  const cameraStatus    = document.getElementById("cameraStatus");
  const cameraStatusMessage = document.getElementById("cameraStatusMessage");
  const guide           = document.getElementById("cameraGuide");
  const flash           = document.getElementById("cameraFlash");
  const btnOpen         = document.getElementById("btnOpenCamera");
  const btnClose        = document.getElementById("btnCloseCamera");
  const btnSwitch       = document.getElementById("btnSwitchCamera");
  const btnCapture      = document.getElementById("btnCapture");
  const shutterInner    = document.getElementById("shutterInner");
  const btnRetake       = document.getElementById("btnRetake");
  const btnRetakeWrap   = document.getElementById("btnRetakeWrap");
  const retakeSpacer    = document.getElementById("retakeSpacer");
  const btnConfirm      = document.getElementById("btnConfirmCapture");
  const btnConfirmWrap  = document.getElementById("btnConfirmWrap");
  const confirmSpacer   = document.getElementById("confirmSpacer");
  const btnNativeCamera = document.getElementById("btnNativeCamera");
  const nativeCameraInput = document.getElementById("nativeCameraInput");

  function setCameraStatus(message, showNativeCamera = false) {
    if (cameraStatusMessage) cameraStatusMessage.textContent = message;
    if (cameraStatus) cameraStatus.classList.toggle("hidden", !message);
    if (btnNativeCamera) btnNativeCamera.classList.toggle("hidden", !showNativeCamera);
  }

  function waitForCameraFrame() {
    if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timeout);
        video.removeEventListener("loadeddata", checkFrame);
        video.removeEventListener("playing", checkFrame);
      };
      const checkFrame = () => {
        if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
          cleanup();
          resolve();
        }
      };
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Không nhận được hình ảnh từ camera sau vài giây."));
      }, 6000);

      video.addEventListener("loadeddata", checkFrame);
      video.addEventListener("playing", checkFrame);
      checkFrame();
    });
  }

  function setPostCaptureUI(captured) {
    // Retake group
    if (btnRetakeWrap) {
      btnRetakeWrap.style.display = captured ? "flex" : "none";
    }
    if (retakeSpacer) retakeSpacer.style.display = captured ? "none" : "block";

    // Confirm group
    if (btnConfirmWrap) {
      btnConfirmWrap.style.display = captured ? "flex" : "none";
    }
    if (confirmSpacer) confirmSpacer.style.display = captured ? "none" : "block";
  }

  async function startCamera() {
    stopCamera();
    hasCaptured = false;
    video.classList.remove("hidden");
    canvas.classList.add("hidden");
    if (guide) guide.classList.remove("hidden");
    setPostCaptureUI(false);
    setCameraStatus("Đang kết nối camera...");

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Trình duyệt không hỗ trợ camera trực tiếp. Hãy mở trang bằng Safari hoặc Chrome.");
      }

      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      video.srcObject = cameraStream;
      await video.play();
      await waitForCameraFrame();
      setCameraStatus("");
    } catch (err) {
      stopCamera();
      const errorName = err && err.name;
      let message = err instanceof Error ? err.message : "Không thể mở camera.";
      if (errorName === "NotAllowedError" || errorName === "SecurityError") {
        message = "Camera chưa được cấp quyền. Hãy cho phép truy cập camera trong cài đặt trình duyệt.";
      } else if (errorName === "NotFoundError") {
        message = "Không tìm thấy camera trên thiết bị này.";
      } else if (errorName === "NotReadableError") {
        message = "Camera đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại.";
      }
      setCameraStatus(message + " Bạn cũng có thể chụp bằng camera điện thoại.", true);
      showToast(message, "error");
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    if (video) video.srcObject = null;
  }

  function openCamera() {
    if (nativeCameraInput && window.matchMedia("(max-width: 640px)").matches) {
      nativeCameraInput.click();
      return;
    }
    if (modal) modal.classList.remove("hidden");
    startCamera();
  }

  function closeCamera() {
    stopCamera();
    if (modal) modal.classList.add("hidden");
    hasCaptured = false;
  }

  function triggerFlash() {
    if (!flash) return;
    flash.style.opacity = "0.85";
    setTimeout(() => { flash.style.opacity = "0"; }, 120);
  }

  function captureFrame() {
    if (hasCaptured) {
      // ---- Chụp lại: quay về live stream ----
      hasCaptured = false;
      video.classList.remove("hidden");
      canvas.classList.add("hidden");
      if (guide) guide.classList.remove("hidden");
      setPostCaptureUI(false);
      return;
    }

    // ---- Chụp: lấy frame hiện tại ----
    if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      showToast("Camera chưa sẵn sàng, vui lòng đợi rồi thử lại.", "info");
      return;
    }

    // Shutter animation: thu nhỏ inner rồi phục hồi
    if (shutterInner) {
      shutterInner.style.transform = "scale(0.7)";
      setTimeout(() => { shutterInner.style.transform = "scale(1)"; }, 180);
    }

    triggerFlash();

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    hasCaptured = true;
    video.classList.add("hidden");
    canvas.classList.remove("hidden");
    if (guide) guide.classList.add("hidden");
    setPostCaptureUI(true);
  }

  function confirmCapture() {
    canvas.toBlob(blob => {
      if (!blob) {
        showToast("Không thể lấy ảnh từ camera.", "error");
        return;
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const file = new File([blob], `camera_${timestamp}.jpg`, { type: "image/jpeg" });
      handleFilesAdded([file]);
      showToast("Đã thêm ảnh vào hàng chờ!", "success");
      closeCamera();
    }, "image/jpeg", 0.93);
  }

  async function switchCamera() {
    facingMode = facingMode === "environment" ? "user" : "environment";
    await startCamera();
  }

  // Wire events
  if (btnOpen)    btnOpen.addEventListener("click", openCamera);
  if (btnClose)   btnClose.addEventListener("click", closeCamera);
  if (btnCapture) btnCapture.addEventListener("click", captureFrame);
  if (btnRetake)  btnRetake.addEventListener("click", captureFrame); // same action = retake
  if (btnConfirm) btnConfirm.addEventListener("click", confirmCapture);
  if (btnSwitch)  btnSwitch.addEventListener("click", switchCamera);
  if (btnNativeCamera && nativeCameraInput) {
    btnNativeCamera.addEventListener("click", () => nativeCameraInput.click());
    nativeCameraInput.addEventListener("change", () => {
      const file = nativeCameraInput.files && nativeCameraInput.files[0];
      if (!file) {
        nativeCameraInput.value = "";
        return;
      }
      if (!/\.(jpe?g|png|webp)$/i.test(file.name)) {
        nativeCameraInput.value = "";
        showToast("Ảnh từ camera cần ở định dạng JPG, PNG hoặc WEBP.", "error");
        return;
      }
      handleFilesAdded([file]);
      nativeCameraInput.value = "";
      showToast("Đã thêm ảnh vào hàng chờ!", "success");
      closeCamera();
    });
  }

  // Close on backdrop click
  if (modal) modal.addEventListener("click", (e) => {
    if (e.target === modal) closeCamera();
  });

  // Init spacers visible
  setPostCaptureUI(false);
})();

init();

// ================= MOBILE QR CONNECT SYSTEM =================
(function() {
  const qrState = {
    sessionId: null,
    connectUrl: null,
    appUrl: null,
    currentMode: "scanner", // 'scanner' or 'full_app'
    pollInterval: null,
    qrCodeInstance: null,
    isPhoneConnected: false,
    totalFilesReceived: 0,
    availableIps: [],
    selectedIp: null,
    port: 8000,
    publicUrl: false
  };

  const elements = {
    modal: document.getElementById("mobileConnectModal"),
    btnClose: document.getElementById("btnCloseMobileConnect"),
    btnOpenHeader: document.getElementById("btnOpenMobileConnectHeader"),
    btnOpenUpload: document.getElementById("btnOpenMobileConnectUpload"),
    btnSwitchCamera: document.getElementById("btnSwitchToQrConnect"),
    qrcodeBox: document.getElementById("qrcodeBox"),
    qrLoading: document.getElementById("qrLoading"),
    qrStatusText: document.getElementById("qrStatusText"),
    qrConnectionStatus: document.getElementById("qrConnectionStatus"),
    qrFilesReceivedBanner: document.getElementById("qrFilesReceivedBanner"),
    qrFilesReceivedText: document.getElementById("qrFilesReceivedText"),
    inputConnectUrl: document.getElementById("inputConnectUrl"),
    btnCopyConnectUrl: document.getElementById("btnCopyConnectUrl"),
    tabScanner: document.getElementById("tabModeScanner"),
    tabFullApp: document.getElementById("tabModeFullApp"),
    selectNetworkIp: document.getElementById("selectNetworkIp")
  };

  async function initSession() {
    if (elements.qrLoading) elements.qrLoading.classList.remove("hidden");
    try {
      const res = await fetch("/api/connect/session/create", { method: "POST" });
      if (!res.ok) throw new Error("Không thể khởi tạo phiên kết nối");
      const data = await res.json();
      qrState.sessionId = data.session_id;
      qrState.connectUrl = data.connect_url;
      qrState.appUrl = data.app_url;
      qrState.availableIps = data.available_ips || [data.local_ip];
      qrState.publicUrl = data.public_url === true;
      qrState.selectedIp = qrState.publicUrl ? null : data.local_ip;
      qrState.port = data.port || 8000;

      setupIpSelector();
      renderQrCode();
      startPolling();
    } catch (err) {
      console.error("Init session error:", err);
      showToast("Lỗi khởi tạo kết nối: " + err.message, "error");
    } finally {
      if (elements.qrLoading) elements.qrLoading.classList.add("hidden");
    }
  }

  function setupIpSelector() {
    if (!elements.selectNetworkIp) return;
    if (qrState.availableIps && qrState.availableIps.length > 1) {
      elements.selectNetworkIp.innerHTML = "";
      qrState.availableIps.forEach(ip => {
        const opt = document.createElement("option");
        opt.value = ip;
        opt.innerText = ip;
        if (ip === qrState.selectedIp) opt.selected = true;
        elements.selectNetworkIp.appendChild(opt);
      });
      elements.selectNetworkIp.classList.remove("hidden");
    } else {
      elements.selectNetworkIp.classList.add("hidden");
    }
  }

  function getActiveUrl() {
    if (qrState.publicUrl) {
      return qrState.currentMode === "scanner"
        ? `${window.location.origin}/connect?session=${encodeURIComponent(qrState.sessionId)}`
        : `${window.location.origin}/`;
    }
    const host = qrState.selectedIp || window.location.hostname;
    const portStr = qrState.port ? `:${qrState.port}` : "";
    return qrState.currentMode === "scanner"
      ? `http://${host}${portStr}/connect?session=${encodeURIComponent(qrState.sessionId)}`
      : `http://${host}${portStr}/`;
  }

  function renderQrCode() {
    if (!elements.qrcodeBox) return;
    const targetUrl = getActiveUrl();
    if (elements.inputConnectUrl) elements.inputConnectUrl.value = targetUrl;

    elements.qrcodeBox.innerHTML = "";
    if (typeof QRCode !== "undefined") {
      qrState.qrCodeInstance = new QRCode(elements.qrcodeBox, {
        text: targetUrl,
        width: 190,
        height: 190,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      elements.qrcodeBox.innerHTML = `
        <div class="text-center p-4 text-xs text-slate-500">
          <i class="fa-solid fa-link text-2xl text-brand-500 mb-2"></i>
          <p class="font-semibold">Mở link trên điện thoại:</p>
          <p class="font-mono mt-1 text-slate-800 break-all select-all">${targetUrl}</p>
        </div>
      `;
    }
  }

  async function pollStatus() {
    if (!qrState.sessionId) return;
    try {
      const res = await fetch(`/api/connect/session/${qrState.sessionId}/status`);
      if (!res.ok) return;
      const data = await res.json();

      // Phone connection state
      if (data.connected !== qrState.isPhoneConnected) {
        qrState.isPhoneConnected = data.connected;
        updateConnectionUI(data.connected);
      }

      // Check for incoming files
      if (data.new_files && data.new_files.length > 0) {
        await handleIncomingMobileFiles(data.new_files);
      }

      // Check for incoming actions
      if (data.actions && data.actions.length > 0) {
        data.actions.forEach(actionItem => {
          if (actionItem.action === "start_extraction") {
            showToast("Điện thoại vừa yêu cầu bắt đầu trích xuất AI!", "info");
            startBatchExtraction();
          }
        });
      }
    } catch (e) {
      // Ignore background network errors
    }
  }

  function updateConnectionUI(connected) {
    if (!elements.qrConnectionStatus || !elements.qrStatusText) return;
    if (connected) {
      elements.qrConnectionStatus.className = "mt-3.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-2";
      elements.qrConnectionStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span><span>Điện thoại đã kết nối! Sẵn sàng nhận ảnh.</span>`;
      showToast("🟢 Điện thoại đã kết nối thành công!", "success");
    } else {
      elements.qrConnectionStatus.className = "mt-3.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-2";
      elements.qrConnectionStatus.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span><span>Đang đợi điện thoại quét mã...</span>`;
    }
  }

  async function handleIncomingMobileFiles(files) {
    const downloadedFiles = [];
    let hasLandCover = false;
    for (let f of files) {
      try {
        const res = await fetch(f.file_url);
        if (!res.ok) continue;
        const blob = await res.blob();
        const fileObj = new File([blob], f.filename, { type: f.content_type || "image/jpeg" });
        downloadedFiles.push(fileObj);
        hasLandCover = hasLandCover || f.document_type === "land_cover";
        qrState.totalFilesReceived++;
      } catch (err) {
        console.error("Error fetching file transferred from phone:", err);
      }
    }

    if (downloadedFiles.length > 0) {
      if (hasLandCover && el.templateSelect) {
        el.templateSelect.value = "land_cover";
        el.templateSelect.dispatchEvent(new Event("change"));
      }
      handleFilesAdded(downloadedFiles);
      showToast(`📸 Đã nhận ${downloadedFiles.length} tài liệu từ điện thoại!`, "success");

      // Update banner
      if (elements.qrFilesReceivedBanner && elements.qrFilesReceivedText) {
        elements.qrFilesReceivedBanner.classList.remove("hidden");
        elements.qrFilesReceivedText.innerText = `Đã nhận ${qrState.totalFilesReceived} tài liệu từ điện thoại`;
      }
    }
  }

  function startPolling() {
    stopPolling();
    qrState.pollInterval = setInterval(pollStatus, 1500);
  }

  function stopPolling() {
    if (qrState.pollInterval) {
      clearInterval(qrState.pollInterval);
      qrState.pollInterval = null;
    }
  }

  function openModal() {
    if (elements.modal) elements.modal.classList.remove("hidden");
    if (!qrState.sessionId) {
      initSession();
    } else {
      renderQrCode();
      startPolling();
    }
  }

  function closeModal() {
    if (elements.modal) elements.modal.classList.add("hidden");
    stopPolling();
    // Continue checking in background every 3s if phone is connected
    if (qrState.sessionId && qrState.isPhoneConnected) {
      qrState.pollInterval = setInterval(pollStatus, 3000);
    }
  }

  function switchMode(mode) {
    qrState.currentMode = mode;
    if (mode === "scanner") {
      elements.tabScanner.className = "flex-1 py-1.5 rounded-lg bg-white text-brand-700 font-semibold shadow-sm transition";
      elements.tabFullApp.className = "flex-1 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition";
    } else {
      elements.tabFullApp.className = "flex-1 py-1.5 rounded-lg bg-white text-brand-700 font-semibold shadow-sm transition";
      elements.tabScanner.className = "flex-1 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 transition";
    }
    renderQrCode();
  }

  // Event Listeners
  if (elements.btnOpenHeader) elements.btnOpenHeader.addEventListener("click", openModal);
  if (elements.btnOpenUpload) elements.btnOpenUpload.addEventListener("click", openModal);
  if (elements.btnClose) elements.btnClose.addEventListener("click", closeModal);
  if (elements.btnSwitchCamera) {
    elements.btnSwitchCamera.addEventListener("click", () => {
      const cameraModal = document.getElementById("cameraModal");
      if (cameraModal) cameraModal.classList.add("hidden");
      const video = document.getElementById("cameraVideo");
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(t => t.stop());
        video.srcObject = null;
      }
      openModal();
    });
  }

  if (elements.tabScanner) elements.tabScanner.addEventListener("click", () => switchMode("scanner"));
  if (elements.tabFullApp) elements.tabFullApp.addEventListener("click", () => switchMode("full_app"));

  if (elements.selectNetworkIp) {
    elements.selectNetworkIp.addEventListener("change", (e) => {
      qrState.selectedIp = e.target.value;
      renderQrCode();
    });
  }

  if (elements.btnCopyConnectUrl) {
    elements.btnCopyConnectUrl.addEventListener("click", () => {
      const url = getActiveUrl();
      navigator.clipboard.writeText(url).then(() => {
        showToast("Đã sao chép liên kết vào bộ nhớ tạm!", "success");
      }).catch(() => {
        if (elements.inputConnectUrl) {
          elements.inputConnectUrl.select();
          document.execCommand("copy");
          showToast("Đã sao chép liên kết!", "success");
        }
      });
    });
  }

  if (elements.modal) {
    elements.modal.addEventListener("click", (e) => {
      if (e.target === elements.modal) closeModal();
    });
  }
})();
