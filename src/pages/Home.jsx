"use client"

import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

const Home = () => {
  // Sample binders with different themes - simplified
  const sampleBinders = [
    {
      id: 1,
      name: "Starter Collection",
      cards: [
        { name: "Charizard", image: "https://tcgplayer-cdn.tcgplayer.com/product/84186_200w.jpg" }, // Base Set Charizard
        { name: "Blastoise", image: "https://tcgplayer-cdn.tcgplayer.com/product/84188_200w.jpg" }, // Base Set Blastoise
        { name: "Venusaur", image: "https://tcgplayer-cdn.tcgplayer.com/product/84190_200w.jpg" }, // Base Set Venusaur
        { name: "Pikachu", image: "https://tcgplayer-cdn.tcgplayer.com/product/24295_200w.jpg" }, // Jungle Pikachu
        { name: "Raichu", image: "https://tcgplayer-cdn.tcgplayer.com/product/84200_200w.jpg" }, // Base Set Raichu
        { name: "Alakazam", image: "https://tcgplayer-cdn.tcgplayer.com/product/84177_200w.jpg" }, // Base Set Alakazam
        { name: "Machamp", image: "https://tcgplayer-cdn.tcgplayer.com/product/84194_200w.jpg" }, // Base Set Machamp
        { name: "Golem", image: "https://tcgplayer-cdn.tcgplayer.com/product/24300_200w.jpg" }, // Fossil Golem
        { name: "Gengar", image: "https://tcgplayer-cdn.tcgplayer.com/product/24311_200w.jpg" }, // Fossil Gengar
      ],
    },
    {
      id: 2,
      name: "Legendary Vault",
      cards: [
        { name: "Mewtwo", image: "https://tcgplayer-cdn.tcgplayer.com/product/84197_200w.jpg" }, // Base Set Mewtwo
        { name: "Mew", image: "https://tcgplayer-cdn.tcgplayer.com/product/24744_200w.jpg" }, // Black Star Promo Mew
        { name: "Lugia", image: "https://tcgplayer-cdn.tcgplayer.com/product/25427_200w.jpg" }, // Neo Genesis Lugia
        { name: "Ho-Oh", image: "https://tcgplayer-cdn.tcgplayer.com/product/25425_200w.jpg" }, // Neo Revelation Ho-Oh
        { name: "Celebi", image: "https://tcgplayer-cdn.tcgplayer.com/product/25424_200w.jpg" }, // Neo Revelation Celebi
        { name: "Kyogre", image: "https://tcgplayer-cdn.tcgplayer.com/product/122326_200w.jpg" }, // Primal Clash Kyogre EX
        { name: "Groudon", image: "https://tcgplayer-cdn.tcgplayer.com/product/122328_200w.jpg" }, // Primal Clash Groudon EX
        { name: "Rayquaza", image: "https://tcgplayer-cdn.tcgplayer.com/product/100973_200w.jpg" }, // Roaring Skies Rayquaza EX
        { name: "Dialga", image: "https://tcgplayer-cdn.tcgplayer.com/product/104277_200w.jpg" }, // Phantom Forces Dialga EX
      ],
    },
    {
      id: 3,
      name: "Shiny Showcase",
      cards: [
        { name: "Shiny Gyarados", image: "https://tcgplayer-cdn.tcgplayer.com/product/25428_200w.jpg" }, // Neo Revelation Shining Gyarados
        { name: "Shiny Dragonite", image: "https://tcgplayer-cdn.tcgplayer.com/product/25429_200w.jpg" }, // Neo Destiny Shining Dragonite
        { name: "Shiny Metagross", image: "https://tcgplayer-cdn.tcgplayer.com/product/146257_200w.jpg" }, // Hidden Fates Shiny Metagross GX
        { name: "Shiny Lucario", image: "https://tcgplayer-cdn.tcgplayer.com/product/146262_200w.jpg" }, // Hidden Fates Shiny Lucario GX
        { name: "Shiny Garchomp", image: "https://tcgplayer-cdn.tcgplayer.com/product/146260_200w.jpg" }, // Hidden Fates Shiny Garchomp
        { name: "Shiny Zoroark", image: "https://tcgplayer-cdn.tcgplayer.com/product/146264_200w.jpg" }, // Hidden Fates Shiny Zoroark GX
        { name: "Shiny Greninja", image: "https://tcgplayer-cdn.tcgplayer.com/product/146258_200w.jpg" }, // Hidden Fates Shiny Greninja GX
        { name: "Shiny Decidueye", image: "https://tcgplayer-cdn.tcgplayer.com/product/146253_200w.jpg" }, // Hidden Fates Shiny Decidueye GX
        { name: "Shiny Dragapult", image: "https://tcgplayer-cdn.tcgplayer.com/product/213563_200w.jpg" }, // Shining Fates Shiny Dragapult VMAX
      ],
    },
    {
      id: 4,
      name: "Eeveelution Set",
      cards: [
        { name: "Eevee", image: "https://tcgplayer-cdn.tcgplayer.com/product/165226_200w.jpg" }, // Hidden Fates Eevee
        { name: "Vaporeon", image: "https://tcgplayer-cdn.tcgplayer.com/product/25431_200w.jpg" }, // Jungle Vaporeon
        { name: "Jolteon", image: "https://tcgplayer-cdn.tcgplayer.com/product/25433_200w.jpg" }, // Jungle Jolteon
        { name: "Flareon", image: "https://tcgplayer-cdn.tcgplayer.com/product/25432_200w.jpg" }, // Jungle Flareon
        { name: "Espeon", image: "https://tcgplayer-cdn.tcgplayer.com/product/25434_200w.jpg" }, // Neo Discovery Espeon
        { name: "Umbreon", image: "https://tcgplayer-cdn.tcgplayer.com/product/25435_200w.jpg" }, // Neo Discovery Umbreon
        { name: "Leafeon", image: "https://tcgplayer-cdn.tcgplayer.com/product/145624_200w.jpg" }, // Ultra Prism Leafeon GX
        { name: "Glaceon", image: "https://tcgplayer-cdn.tcgplayer.com/product/145626_200w.jpg" }, // Ultra Prism Glaceon GX
        { name: "Sylveon", image: "https://tcgplayer-cdn.tcgplayer.com/product/133869_200w.jpg" }, // Guardians Rising Sylveon GX
      ],
    },
    {
      id: 5,
      name: "Champion Cards",
      cards: [
        { name: "Tatsugiri", image: "https://tcgplayer-cdn.tcgplayer.com/product/550230_in_1000x1000.jpg" },
        { name: "Tatsugiri", image: "https://tcgplayer-cdn.tcgplayer.com/product/550230_in_1000x1000.jpg" },
        { name: "Tatsugiri", image: "https://tcgplayer-cdn.tcgplayer.com/product/550230_in_1000x1000.jpg" },
        { name: "Tatsugiri", image: "https://tcgplayer-cdn.tcgplayer.com/product/550230_in_1000x1000.jpg" },
        { name: "Tatsugiri", image: "https://tcgplayer-cdn.tcgplayer.com/product/550230_in_1000x1000.jpg" },
        { name: "Tatsugiri", image: "https://tcgplayer-cdn.tcgplayer.com/product/550230_in_1000x1000.jpg" },
        { name: "Tatsugiri", image: "https://tcgplayer-cdn.tcgplayer.com/product/550230_in_1000x1000.jpg" },
        { name: "Tatsugiri", image: "https://tcgplayer-cdn.tcgplayer.com/product/550230_in_1000x1000.jpg" },
        { name: "Tatsugiri", image: "https://tcgplayer-cdn.tcgplayer.com/product/550230_in_1000x1000.jpg" },
      ],
    },
    {
      id: 6,
      name: "Classic Collection",
      cards: [
        { name: "Alakazam", image: "https://tcgplayer-cdn.tcgplayer.com/product/84177_200w.jpg" }, // Base Set Alakazam
        { name: "Machamp", image: "https://tcgplayer-cdn.tcgplayer.com/product/84194_200w.jpg" }, // Base Set Machamp
        { name: "Golem", image: "https://tcgplayer-cdn.tcgplayer.com/product/24300_200w.jpg" }, // Fossil Golem
        { name: "Gengar", image: "https://tcgplayer-cdn.tcgplayer.com/product/24311_200w.jpg" }, // Fossil Gengar
        { name: "Lapras", image: "https://tcgplayer-cdn.tcgplayer.com/product/24313_200w.jpg" }, // Fossil Lapras
        { name: "Snorlax", image: "https://tcgplayer-cdn.tcgplayer.com/product/24320_200w.jpg" }, // Jungle Snorlax
        { name: "Dragonite", image: "https://tcgplayer-cdn.tcgplayer.com/product/24310_200w.jpg" }, // Fossil Dragonite
        { name: "Mewtwo", image: "https://tcgplayer-cdn.tcgplayer.com/product/84197_200w.jpg" }, // Base Set Mewtwo
        { name: "Mew", image: "https://tcgplayer-cdn.tcgplayer.com/product/24744_200w.jpg" }, // Black Star Promo Mew
      ],
    },
    {
      id: 7,
      name: "Modern Masters",
      cards: [
        { name: "Lucario", image: "https://tcgplayer-cdn.tcgplayer.com/product/89313_200w.jpg" }, // Furious Fists Lucario EX
        { name: "Garchomp", image: "https://tcgplayer-cdn.tcgplayer.com/product/100977_200w.jpg" }, // Ultra Prism Garchomp
        { name: "Dialga", image: "https://tcgplayer-cdn.tcgplayer.com/product/104277_200w.jpg" }, // Phantom Forces Dialga EX
        { name: "Palkia", image: "https://tcgplayer-cdn.tcgplayer.com/product/145621_200w.jpg" }, // Ultra Prism Palkia GX
        { name: "Giratina", image: "https://tcgplayer-cdn.tcgplayer.com/product/159978_200w.jpg" }, // Unified Minds Giratina
        { name: "Arceus & Dialga & Palkia GX", image: "https://tcgplayer-cdn.tcgplayer.com/product/183818_200w.jpg" }, // Cosmic Eclipse Arceus & Dialga & Palkia GX
        { name: "Reshiram & Charizard GX", image: "https://tcgplayer-cdn.tcgplayer.com/product/159981_200w.jpg" }, // Unbroken Bonds Reshiram & Charizard GX
        { name: "Zekrom & Pikachu GX", image: "https://tcgplayer-cdn.tcgplayer.com/product/183815_200w.jpg" }, // Team Up Pikachu & Zekrom GX
        { name: "Kyurem", image: "https://tcgplayer-cdn.tcgplayer.com/product/145630_200w.jpg" }, // Dragon Majesty Kyurem
      ],
    },
    {
      id: 8,
      name: "Rare Finds",
      cards: [
        { name: "Charizard GX", image: "https://tcgplayer-cdn.tcgplayer.com/product/146249_200w.jpg" }, // Hidden Fates Charizard GX
        { name: "Pikachu VMAX", image: "https://tcgplayer-cdn.tcgplayer.com/product/221624_200w.jpg" }, // Vivid Voltage Pikachu VMAX
        { name: "Mewtwo EX", image: "https://tcgplayer-cdn.tcgplayer.com/product/100969_200w.jpg" }, // BREAKthrough Mewtwo EX
        { name: "Rayquaza V", image: "https://tcgplayer-cdn.tcgplayer.com/product/239245_200w.jpg" }, // Evolving Skies Rayquaza V
        { name: "Lugia VSTAR", image: "https://tcgplayer-cdn.tcgplayer.com/product/284206_200w.jpg" }, // Silver Tempest Lugia VSTAR
        { name: "Giratina V", image: "https://tcgplayer-cdn.tcgplayer.com/product/273226_200w.jpg" }, // Lost Origin Giratina V
        { name: "Arceus VSTAR", image: "https://tcgplayer-cdn.tcgplayer.com/product/263223_200w.jpg" }, // Brilliant Stars Arceus VSTAR
        { name: "Dialga VSTAR", image: "https://tcgplayer-cdn.tcgplayer.com/product/268360_200w.jpg" }, // Astral Radiance Dialga VSTAR
        { name: "Palkia VSTAR", image: "https://tcgplayer-cdn.tcgplayer.com/product/268362_200w.jpg" }, // Astral Radiance Palkia VSTAR
      ],
    },
  ];

  const infiniteBinders = [
    ...sampleBinders,
    ...sampleBinders,
    ...sampleBinders,
    ...sampleBinders,
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden section-gradient-1">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center animate-fadeInUp">
            <h1 className="text-6xl md:text-7xl font-bold text-slate-900 mb-6">
              Organize Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Collection
              </span>
            </h1>

            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              PokéBinder is the modern way to track, organize, and showcase your Pokémon card collection. Build digital
              binders, track your progress, and never lose sight of your collecting goals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/login"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-3 neon-blue"
              >
                Get Started Free
              </Link>

              <Link
                to="/search"
                className="glass text-slate-700 px-8 py-4 rounded-2xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-3"
              >
                Explore Cards
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full animate-drift"></div>
        <div
          className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full animate-drift"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full animate-drift"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Animated Binder Showcase Section */}
      <div className="section-gradient-2 py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-16">
          <div className="text-center animate-fadeInUp">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Create Beautiful{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Digital Binders
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Organize your cards in stunning digital binders with intuitive functionality
            </p>
          </div>
        </div>

        {/* Full-width Animated Scrolling Binders */}
        <div className="relative overflow-hidden py-8 w-full">
          <div className="flex animate-scroll-left gap-8 w-max">
            {infiniteBinders.map((binder, binderIndex) => (
              <div key={`${binder.id}-${Math.floor(binderIndex / sampleBinders.length)}`} className="flex-shrink-0">
                <div className="relative group">
                  {/* Enhanced Binder with unified black background */}
                  <div className="binder-container rounded-3xl p-8 shadow-2xl w-[800px] hover:shadow-3xl transition-all duration-500 hover:scale-105">
                    <div className="flex gap-2 items-center">
                      {/* Left Page */}
                      <div className="flex-1">
                        <div className="grid grid-cols-3 gap-3">
                          {binder.cards.slice(0, 9).map((card, index) => (
                            <div
                              key={index}
                              className="aspect-[3/4] pokemon-card rounded-lg overflow-hidden group-hover:scale-105 transition-all duration-300"
                            >
                              <img
                                src={card.image || "/placeholder.svg"}
                                alt={card.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Slim Divider */}
                      <div className="binder-divider w-1 h-80 rounded-full"></div>

                      {/* Right Page */}
                      <div className="flex-1">
                        <div className="grid grid-cols-3 gap-3">
                          {binder.cards.slice(9, 18).map((card, index) => (
                            <div
                              key={index}
                              className="aspect-[3/4] pokemon-card rounded-lg overflow-hidden group-hover:scale-105 transition-all duration-300"
                            >
                              <img
                                src={card.image || "/placeholder.svg"}
                                alt={card.name || ""}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subtle decorative elements */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full animate-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full animate-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Single Arrow Button */}
        <div className="text-center mt-12 animate-fadeInUp">
          <Link
            to="/binder-builder"
            className="inline-flex items-center gap-3 group hover:scale-105 transition-all duration-300"
          >
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Start Building Your Collection
            </span>
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg group-hover:shadow-xl transition-all duration-300 neon-blue">
              <ArrowRight
                size={20}
                className="text-white group-hover:translate-x-1 transition-transform duration-300"
              />
            </div>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="section-gradient-3 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 animate-fadeInUp">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Collect Smart
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful tools designed specifically for serious Pokémon card collectors
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: "📊",
                title: "Smart Collection",
                description: "Track your cards with intelligent organization and progress monitoring",
              },
              {
                icon: "🔍",
                title: "Advanced Search",
                description: "Find any card instantly with powerful search and filtering capabilities",
              },
              {
                icon: "⚡",
                title: "Master Sets",
                description: "Create custom collections and track completion across multiple sets",
              },
              {
                icon: "📖",
                title: "Digital Binders",
                description: "Design beautiful binders with intuitive functionality",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="card-container rounded-2xl p-6 hover-lift animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="section-gradient-4 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="card-container rounded-3xl p-12 text-center animate-fadeInUp">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Ready to Organize Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Collection?
              </span>
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Start tracking your cards today and discover the power of organized collecting
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/login"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-3 neon-blue"
              >
                Sign Up Free
              </Link>
              <Link
                to="/search"
                className="glass text-slate-700 px-8 py-4 rounded-2xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-3"
              >
                Browse Cards
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
