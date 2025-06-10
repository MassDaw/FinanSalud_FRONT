document.addEventListener("DOMContentLoaded", function () {
  let cryptoData = null;
  let showOnlyFavorites = false;
  let searchQuery = "";

  const searchInput = document.getElementById("search-input");
  const favoritesBtn = document.getElementById("favorites-btn");
  const cryptoTableBody = document.getElementById("crypto-table-body");
  const cryptoCountElement = document.getElementById("crypto-count");

  // REEMPLAZAR WEBSOCKET CON API DIRECTA
  async function fetchCryptoData() {
    try {
      console.log("🔄 Obteniendo datos de CoinGecko...");

      const [globalResponse, coinsResponse] = await Promise.all([
        fetch("https://api.coingecko.com/api/v3/global"),
        fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=20&sparkline=false"
        ),
      ]);

      const globalData = await globalResponse.json();
      const coins = await coinsResponse.json();

      const formatNumber = (number) => {
        if (number >= 1_000_000_000) {
          return `€${(number / 1_000_000_000).toFixed(2)}B`;
        } else if (number >= 1_000_000) {
          return `€${(number / 1_000_000).toFixed(2)}M`;
        } else {
          return `€${number.toLocaleString()}`;
        }
      };

      cryptoData = {
        type: "crypto",
        market: {
          marketCap: formatNumber(globalData.data.total_market_cap.eur),
          volume24h: formatNumber(globalData.data.total_volume.eur),
          lastUpdated: new Date().toLocaleTimeString(),
        },
        assets: coins.map((coin) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          price: formatNumber(coin.current_price),
          volume: formatNumber(coin.total_volume),
          isFavorite: false,
        })),
      };

      updateUI();
      console.log("✅ Datos actualizados correctamente");
    } catch (error) {
      console.error("❌ Error obteniendo datos:", error);
    }
  }

  // Cargar datos inicialmente
  fetchCryptoData();
  // Actualizar cada 30 segundos
  setInterval(fetchCryptoData, 30000);

  // Configuración de los listeners de eventos
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderCryptoTable();
  });

  favoritesBtn.addEventListener("click", () => {
    showOnlyFavorites = !showOnlyFavorites;
    favoritesBtn.classList.toggle("active", showOnlyFavorites);
    renderCryptoTable();
  });

  function updateUI() {
    if (!cryptoData || !cryptoData.market) {
      console.log("⚠️ No hay datos para mostrar");
      return;
    }

    document.getElementById("crypto-market-cap").textContent =
      cryptoData.market.marketCap;
    document.getElementById("crypto-volume").textContent =
      cryptoData.market.volume24h;
    document.getElementById("crypto-update-time").textContent =
      cryptoData.market.lastUpdated;
    renderCryptoTable();
  }

  function renderCryptoTable() {
    if (!cryptoData || !cryptoData.assets) return;
    const filteredAssets = cryptoData.assets.filter((asset) => {
      const matchesSearch =
        searchQuery === "" ||
        asset.name.toLowerCase().includes(searchQuery) ||
        asset.symbol.toLowerCase().includes(searchQuery);
      return matchesSearch && (!showOnlyFavorites || asset.isFavorite);
    });

    cryptoCountElement.textContent = filteredAssets.length;

    if (filteredAssets.length === 0) {
      cryptoTableBody.innerHTML =
        '<tr><td colspan="3" class="empty-message">No se encontraron activos</td></tr>';
      return;
    }

    cryptoTableBody.innerHTML = filteredAssets
      .map(
        (asset) => `
        <tr>
            <td class="text-left">
                <div class="asset-name-container">
                    <i class="fas fa-star favorite-star ${
                      asset.isFavorite ? "active" : ""
                    }" data-id="${asset.id}"></i>
                    <div class="asset-name">
                        <div>${asset.name}</div>
                        <div class="asset-symbol">${asset.symbol}</div>
                    </div>
                </div>
            </td>
            <td class="text-center">
                <div class="asset-price-container">
                    <div>${asset.price}</div>
                    <div class="asset-volume">Vol: ${asset.volume}</div>
                </div>
            </td>
            <td class="text-center">
                <button class="buy-btn" onclick="window.location.href='https://www.binance.com/es/trade/${
                  asset.symbol
                }_EUR?type=spot'">
                    Comprar
                </button>
            </td>
        </tr>
    `
      )
      .join("");

    // Reasignar eventos a las estrellas de favoritos
    cryptoTableBody.querySelectorAll(".favorite-star").forEach((star) => {
      star.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(e.target.dataset.id);
      });
    });
  }

  function toggleFavorite(id) {
    cryptoData.assets = cryptoData.assets.map((asset) =>
      asset.id === id ? { ...asset, isFavorite: !asset.isFavorite } : asset
    );
    renderCryptoTable();
  }
});
