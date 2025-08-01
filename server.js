const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
};

const PARTS_CONFIG = [
    {
        name: "Phanteks Eclipse G360A",
        category: "Kasa",
        url: null,
        fallbackPrice: 7000
    },
    {
        name: "Intel Core i5-13600K",
        category: "İşlemci",
        url: "https://www.akakce.com/islemci/en-ucuz-intel-i5-13600k-on-dort-cekirdek-3-5-ghz-kutusuz-fiyati,131248530.html",
        fallbackPrice: 8500
    },
    {
        name: "DeepCool LS520 RGB 240mm",
        category: "Soğutucu",
        url: "https://www.akakce.com/islemci-sogutucu/en-ucuz-deepcool-ls520-ls520-rgb-240mm-sivi-sogutma-fiyati,2050740274.html",
        fallbackPrice: 1200
    },
    {
        name: "MSI PRO Z790-S WIFI",
        category: "Anakart",
        url: "https://www.akakce.com/anakart/en-ucuz-msi-pro-z790-s-wi-fi-intel-lga1700-ddr5-atx-fiyati,351609902.html",
        fallbackPrice: 3500
    },
    {
        name: "Patriot Viper Venom 16GB (2x8) 5600MHz DDR5",
        category: "RAM",
        url: "https://www.akakce.com/ram/en-ucuz-patriot-viper-venom-16-gb-2x8-5600-mhz-ddr5-cl40-pvv516g560c40k-fiyati,323814236.html",
        fallbackPrice: 1800
    },
    {
        name: "Kingston KC3000 1TB NVMe SSD",
        category: "SSD",
        url: "https://www.akakce.com/ssd/en-ucuz-kingston-1-tb-kc3000-skc3000s-1024g-m-2-pci-express-4-0-fiyati,1639319475.html",
        fallbackPrice: 1200
    },
    {
        name: "DeepCool PQ650M 650W",
        category: "Güç Kaynağı",
        url: "https://www.akakce.com/power-supply/en-ucuz-deep-cool-pq650m-650-w-fiyati,2094872576.html",
        fallbackPrice: 1500
    },
    {
        name: "Glorious Model O Mat",
        category: "Mouse",
        url: "https://www.akakce.com/mouse/en-ucuz-glorious-model-o-mat-optik-kablolu-oyuncu-fiyati,699751846.html",
        fallbackPrice: 800
    },
    {
        name: "ASUS ROG Strix Scope II RX Red Switch",
        category: "Klavye",
        url: "https://www.akakce.com/klavye/en-ucuz-asus-rog-strix-scope-ii-rx-red-switch-kablolu-mekanik-oyuncu-si-fiyati,561608417.html",
        fallbackPrice: 1200
    },
    {
        name: "Razer BlackShark V2 Pro 2023",
        category: "Kulaklık",
        url: "https://www.akakce.com/kulaklik/en-ucuz-razer-blackshark-v2-pro-2023-kablosuz-mikrofonlu-kulak-ustu-oyuncu-kulakligi-fiyati,180234215.html",
        fallbackPrice: 2500
    },
    {
        name: "PNY RTX 4060 Ti 16GB VERTO OC",
        category: "Ekran Kartı",
        url: null,
        fallbackPrice: 26000
    },
    {
        name: "AOC 24G2ZU 23.8\" Gaming Monitor",
        category: "Monitör",
        url: "https://www.akakce.com/monitor/en-ucuz-aoc-24g2zu-23-8-0-5ms-full-hd-freesync-pivot-oyuncu-u-fiyati,1628831201.html",
        fallbackPrice: null
    }
];

const startDate = new Date();
startDate.setMonth(startDate.getMonth() - 3);

let partsData = {};

async function fetchPriceFromAkakce(url) {
    try {
        const response = await axios.get(url, { 
            headers, 
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: function (status) {
                return status >= 200 && status < 300;
            }
        });
        
        if (!response.data || response.data.length < 100) {
            console.error('Geçersiz yanıt alındı');
            return null;
        }
        const $ = cheerio.load(response.data);
        
        const priceSelectors = [
            '.pt_v8',
            '.pb_v8',
            '.pb_v9',
            '.fiyat',
            '.urun_fiyat',
            'div[class^="p_"] > span',
            'span[content]',
            '.pt_v1',
            '.lowest-price',
            'div.pr_v1',
            '.pd_v7 span',
            '.pd_v8 span'
        ];

        for (const selector of priceSelectors) {
            const elements = $(selector);
            
            for (let i = 0; i < elements.length; i++) {
                const element = elements.eq(i);
                const priceText = element.text().trim();
                
                if (priceText && priceText.length > 0) {
                    const cleanText = priceText
                        .replace(/[^\d,]/g, '')
                        .replace(',', '.');
                    
                    const price = parseFloat(cleanText);
                    
                    if (!isNaN(price) && price > 0) {
                        return price;
                    }
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error(`Fiyat çekilemedi (${url}):`, error.message);
        return null;
    }
}

async function fetchAllPrices() {
    for (const part of PARTS_CONFIG) {
        try {
            if (!part.url) {
                console.log(`${part.name} için sabit fiyat kullanılıyor.`);
                partsData[part.name] = {
                    category: part.category,
                    currentPrice: part.fallbackPrice,
                    priceHistory: [],
                    url: part.url
                };
                continue;
            }
            const waitTime = 1500;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            const price = await fetchPriceFromAkakce(part.url);
            if (price) {
                console.log(`${part.name} için fiyat bulundu.`);
                if (!partsData[part.name]) {
                    partsData[part.name] = {
                        category: part.category,
                        currentPrice: price,
                        priceHistory: [],
                        url: part.url
                    };
                }

                partsData[part.name].currentPrice = price;
                partsData[part.name].priceHistory.push({
                    date: new Date(),
                    price: price
                });
            } else {
                if (!partsData[part.name]) {
                    partsData[part.name] = {
                        category: part.category,
                        currentPrice: part.fallbackPrice,
                        priceHistory: [],
                        url: part.url
                    };
                }
            }
        } catch (error) {
            console.error(`${part.name} için fiyat güncellenemedi:`, error);
        }
    }
}

app.get('/api/parts', (req, res) => {
    res.json(partsData);
});

app.post('/api/update-prices', async (req, res) => {
    try {
        await fetchAllPrices();
        res.json({ success: true, message: 'Fiyatlar güncellendi' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Fiyatlar güncellenirken hata oluştu' });
    }
});

fetchAllPrices().then(() => {
    console.log('İlk fiyat verileri yüklendi');
});

app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
