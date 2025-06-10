document.addEventListener("DOMContentLoaded", function () {
  let cryptoData = null;
  let showOnlyFavorites = false;
  let searchQuery = "";

  const searchInput = document.getElementById("search-input");
  const favoritesBtn = document.getElementById("favorites-btn");
  const cryptoTableBody = document.getElementById("crypto-table-body");
  const cryptoCountElement = document.getElementById("crypto-count");

  // FUNCIÓN PARA OBTENER DATOS REALES SIN WEBSOCKET
  async function fetchCryptoData() {
    try {
      console.log("🔄 Obteniendo datos de criptomonedas...");
      
      // Usar un proxy CORS público
      const proxyUrl = 'https://api.allorigins.win/raw?url=',
      
      const [globalResponse, coinsResponse] = await Promise.all([
        fetch(proxyUrl + encodeURIComponent('https://api.coingecko.com/api/v3/global')),
        fetch(proxyUrl + encodeURIComponent('https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur&order=market_cap_desc&per_page=20&sparkline=false'))
      ]);

      if (!globalResponse.ok || !coinsResponse.ok) {
        throw new Error('Error en la respuesta de la API');
      }

      const globalData = await globalResponse.json();
      const coins = await coinsResponse.json();

      const formatNumber = (number) => {
        if (!number) return "€0.00";
        if (number >= 1_000_000_000) {
          return `€${(number/1_000_000_000).toFixed(2)}B`;
        } else if (number >= 1_000_000) {
          return `€${(number/1_000_000).toFixed(2)}M`;
        } else {
          return `€${number.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
      };

      // Preservar favoritos existentes
      const existingFavorites = cryptoData?.assets ? 
        new Set(cryptoData.assets.filter(a => a.isFavorite).map(a => a.id)) : 
        new Set();

      cryptoData = {
        type: "crypto",
        market: {
          marketCap: formatNumber(globalData?.data?.total_market_cap?.eur || 0),
          volume24h: formatNumber(globalData?.data?.total_volume?.eur || 0),
          lastUpdated: new Date().toLocaleTimeString('es-ES')
        },
        assets: (coins || []).map(coin => ({
          id: coin.id || '',
          name: coin.name || 'Desconocido',
          symbol: (coin.symbol || '').toUpperCase(),
          price: formatNumber(coin.current_price),
          volume: formatNumber(coin.total_volume),
          isFavorite: existingFavorites.has(coin.id)
        }))
      };

      updateUI();
      console.log(`✅ Datos actualizados: ${cryptoData.assets.length} criptomonedas`);

    } catch (error) {
      console.error("❌ Error obteniendo datos:", error);
      
      // Datos de fallback si todo falla
      if (!cryptoData) {
        cryptoData = {
          type: "crypto",
          market: {
            marketCap: "€2.45T",
            volume24h: "€89.2B", 
            lastUpdated: new Date().toLocaleTimeString('es-ES')
          },
          assets: [
            {
              id: "bitcoin",
              name: "Bitcoin",
              symbol: "BTC",
              price: "€65,432.10",
              volume: "€12.3B",
              isFavorite: false
            },
            {
              id: "ethereum", 
              name: "Ethereum",
              symbol: "ETH",
              price: "€3,245.67",
              volume: "€8.7B",
              isFavorite: false
            },
            {
              id: "cardano",
              name: "Cardano", 
              symbol: "ADA",
              price: "€0.42",
              volume: "€245M",
              isFavorite: false
            }
          ]
        };
        updateUI();
        console.log("⚠️ Usando datos de fallback");
      }
    }
  }

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

    // Verificar que los elementos existen antes de actualizar
    const marketCapEl = document.getElementById("crypto-market-cap");
    const volumeEl = document.getElementById("crypto-volume");
    const updateTimeEl = document.getElementById("crypto-update-time");

    if (marketCapEl) marketCapEl.textContent = cryptoData.market.marketCap;
    if (volumeEl) volumeEl.textContent = cryptoData.market.volume24h;
    if (updateTimeEl) updateTimeEl.textContent = cryptoData.market.lastUpdated;

    renderCryptoTable();
  }

  function renderCryptoTable() {
    if (!cryptoData || !cryptoData.assets || !cryptoTableBody) return;

    const filteredAssets = cryptoData.assets.filter((asset) => {
      const matchesSearch =
        searchQuery === "" ||
        asset.name.toLowerCase().includes(searchQuery) ||
        asset.symbol.toLowerCase().includes(searchQuery);
      return matchesSearch && (!showOnlyFavorites || asset.isFavorite);
    });

    if (cryptoCountElement) {
      cryptoCountElement.textContent = filteredAssets.length;
    }

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
    if (cryptoData && cryptoData.assets) {
      cryptoData.assets = cryptoData.assets.map((asset) =>
        asset.id === id ? { ...asset, isFavorite: !asset.isFavorite } : asset
      );
      renderCryptoTable();
    }
  }

  // Cargar datos inicialmente
  fetchCryptoData();

  // Actualizar cada 30 segundos
  setInterval(fetchCryptoData, 30000);
});
