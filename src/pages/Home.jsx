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
        { name: "Charizard", image: "/placeholder.svg?height=280&width=200&text=Charizard" },
        { name: "Blastoise", image: "/placeholder.svg?height=280&width=200&text=Blastoise" },
        { name: "Venusaur", image: "/placeholder.svg?height=280&width=200&text=Venusaur" },
        { name: "Pikachu", image: "/placeholder.svg?height=280&width=200&text=Pikachu" },
        { name: "Raichu", image: "/placeholder.svg?height=280&width=200&text=Raichu" },
        { name: "Alakazam", image: "/placeholder.svg?height=280&width=200&text=Alakazam" },
        { name: "Machamp", image: "/placeholder.svg?height=280&width=200&text=Machamp" },
        { name: "Golem", image: "/placeholder.svg?height=280&width=200&text=Golem" },
        { name: "Gengar", image: "/placeholder.svg?height=280&width=200&text=Gengar" },
      ],
    },
    {
      id: 2,
      name: "Legendary Vault",
      cards: [
        { name: "Mewtwo", image: "/placeholder.svg?height=280&width=200&text=Mewtwo" },
        { name: "Mew", image: "/placeholder.svg?height=280&width=200&text=Mew" },
        { name: "Lugia", image: "/placeholder.svg?height=280&width=200&text=Lugia" },
        { name: "Ho-Oh", image: "/placeholder.svg?height=280&width=200&text=Ho-Oh" },
        { name: "Celebi", image: "/placeholder.svg?height=280&width=200&text=Celebi" },
        { name: "Kyogre", image: "/placeholder.svg?height=280&width=200&text=Kyogre" },
        { name: "Groudon", image: "/placeholder.svg?height=280&width=200&text=Groudon" },
        { name: "Rayquaza", image: "/placeholder.svg?height=280&width=200&text=Rayquaza" },
        { name: "Dialga", image: "/placeholder.svg?height=280&width=200&text=Dialga" },
      ],
    },
    {
      id: 3,
      name: "Shiny Showcase",
      cards: [
        { name: "Shiny Gyarados", image: "/placeholder.svg?height=280&width=200&text=Shiny+Gyarados" },
        { name: "Shiny Dragonite", image: "/placeholder.svg?height=280&width=200&text=Shiny+Dragonite" },
        { name: "Shiny Metagross", image: "/placeholder.svg?height=280&width=200&text=Shiny+Metagross" },
        { name: "Shiny Lucario", image: "/placeholder.svg?height=280&width=200&text=Shiny+Lucario" },
        { name: "Shiny Garchomp", image: "/placeholder.svg?height=280&width=200&text=Shiny+Garchomp" },
        { name: "Shiny Zoroark", image: "/placeholder.svg?height=280&width=200&text=Shiny+Zoroark" },
        { name: "Shiny Greninja", image: "/placeholder.svg?height=280&width=200&text=Shiny+Greninja" },
        { name: "Shiny Decidueye", image: "/placeholder.svg?height=280&width=200&text=Shiny+Decidueye" },
        { name: "Shiny Dragapult", image: "/placeholder.svg?height=280&width=200&text=Shiny+Dragapult" },
      ],
    },
    {
      id: 4,
      name: "Eeveelution Set",
      cards: [
        { name: "Eevee", image: "/placeholder.svg?height=280&width=200&text=Eevee" },
        { name: "Vaporeon", image: "/placeholder.svg?height=280&width=200&text=Vaporeon" },
        { name: "Jolteon", image: "/placeholder.svg?height=280&width=200&text=Jolteon" },
        { name: "Flareon", image: "/placeholder.svg?height=280&width=200&text=Flareon" },
        { name: "Espeon", image: "/placeholder.svg?height=280&width=200&text=Espeon" },
        { name: "Umbreon", image: "/placeholder.svg?height=280&width=200&text=Umbreon" },
        { name: "Leafeon", image: "/placeholder.svg?height=280&width=200&text=Leafeon" },
        { name: "Glaceon", image: "/placeholder.svg?height=280&width=200&text=Glaceon" },
        { name: "Sylveon", image: "/placeholder.svg?height=280&width=200&text=Sylveon" },
      ],
    },
    {
      id: 5,
      name: "Champion Cards",
      cards: [
        { name: "Red's Pikachu", image: "/placeholder.svg?height=280&width=200&text=Red's+Pikachu" },
        { name: "Blue's Blastoise", image: "/placeholder.svg?height=280&width=200&text=Blue's+Blastoise" },
        { name: "Lance's Dragonite", image: "/placeholder.svg?height=280&width=200&text=Lance's+Dragonite" },
        { name: "Cynthia's Garchomp", image: "/placeholder.svg?height=280&width=200&text=Cynthia's+Garchomp" },
        { name: "Steven's Metagross", image: "/placeholder.svg?height=280&width=200&text=Steven's+Metagross" },
        { name: "Leon's Charizard", image: "/placeholder.svg?height=280&width=200&text=Leon's+Charizard" },
        { name: "Diantha's Gardevoir", image: "/placeholder.svg?height=280&width=200&text=Diantha's+Gardevoir" },
        { name: "Alder's Volcarona", image: "/placeholder.svg?height=280&width=200&text=Alder's+Volcarona" },
        { name: "Iris's Haxorus", image: "/placeholder.svg?height=280&width=200&text=Iris's+Haxorus" },
      ],
    },
    {
      id: 6,
      name: "Classic Collection",
      cards: [
        { name: "Alakazam", image: "/placeholder.svg?height=280&width=200&text=Alakazam" },
        { name: "Machamp", image: "/placeholder.svg?height=280&width=200&text=Machamp" },
        { name: "Golem", image: "/placeholder.svg?height=280&width=200&text=Golem" },
        { name: "Gengar", image: "/placeholder.svg?height=280&width=200&text=Gengar" },
        { name: "Lapras", image: "/placeholder.svg?height=280&width=200&text=Lapras" },
        { name: "Snorlax", image: "/placeholder.svg?height=280&width=200&text=Snorlax" },
        { name: "Dragonite", image: "/placeholder.svg?height=280&width=200&text=Dragonite" },
        { name: "Mewtwo", image: "/placeholder.svg?height=280&width=200&text=Mewtwo" },
        { name: "Mew", image: "/placeholder.svg?height=280&width=200&text=Mew" },
      ],
    },
    {
      id: 7,
      name: "Modern Masters",
      cards: [
        { name: "Lucario", image: "/placeholder.svg?height=280&width=200&text=Lucario" },
        { name: "Garchomp", image: "/placeholder.svg?height=280&width=200&text=Garchomp" },
        { name: "Dialga", image: "/placeholder.svg?height=280&width=200&text=Dialga" },
        { name: "Palkia", image: "/placeholder.svg?height=280&width=200&text=Palkia" },
        { name: "Giratina", image: "/placeholder.svg?height=280&width=200&text=Giratina" },
        { name: "Arceus", image: "/placeholder.svg?height=280&width=200&text=Arceus" },
        { name: "Reshiram", image: "/placeholder.svg?height=280&width=200&text=Reshiram" },
        { name: "Zekrom", image: "/placeholder.svg?height=280&width=200&text=Zekrom" },
        { name: "Kyurem", image: "/placeholder.svg?height=280&width=200&text=Kyurem" },
      ],
    },
    {
      id: 8,
      name: "Rare Finds",
      cards: [
        { name: "Charizard GX", image: "/placeholder.svg?height=280&width=200&text=Charizard+GX" },
        { name: "Pikachu VMAX", image: "/placeholder.svg?height=280&width=200&text=Pikachu+VMAX" },
        { name: "Mewtwo EX", image: "/placeholder.svg?height=280&width=200&text=Mewtwo+EX" },
        { name: "Rayquaza V", image: "/placeholder.svg?height=280&width=200&text=Rayquaza+V" },
        { name: "Lugia VSTAR", image: "/placeholder.svg?height=280&width=200&text=Lugia+VSTAR" },
        { name: "Giratina V", image: "/placeholder.svg?height=280&width=200&text=Giratina+V" },
        { name: "Arceus VSTAR", image: "/placeholder.svg?height=280&width=200&text=Arceus+VSTAR" },
        { name: "Dialga VSTAR", image: "/placeholder.svg?height=280&width=200&text=Dialga+VSTAR" },
        { name: "Palkia VSTAR", image: "/placeholder.svg?height=280&width=200&text=Palkia+VSTAR" },
      ],
    },
  ]

  // Quadruple the array to create seamless loop and make it span entire screen
  const infiniteBinders = [...sampleBinders, ...sampleBinders, ...sampleBinders, ...sampleBinders]

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
                  {/* Simple Binder */}
                  <div className="binder-page rounded-3xl p-6 shadow-2xl w-80 hover:shadow-3xl transition-all duration-500 hover:scale-105">
                    {/* Binder Rings */}
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-5 h-5 binder-ring rounded-full"></div>
                      ))}
                    </div>

                    {/* Cards Grid - 3x3 */}
                    <div className="ml-6 grid grid-cols-3 gap-3">
                      {binder.cards.map((card, index) => (
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
