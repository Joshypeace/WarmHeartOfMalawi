import Link from "next/link"
import { Heart, Mail, Phone, MapPin } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container py-8 md:py-12 px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Brand */}
          <div className="space-y-3 md:space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary">
                <Heart className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground fill-current" />
              </div>
              <span className="text-lg md:text-xl font-bold">WaHeA</span>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-xs">
              Connecting Malawian artisans and vendors with customers worldwide. The Warm Heart of Malawi.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Quick Links</h3>
            <ul className="space-y-2 text-xs md:text-sm">
              <li>
                <Link href="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/vendors" className="text-muted-foreground hover:text-foreground transition-colors">
                  Vendors
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h3 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">For Vendors</h3>
            <ul className="space-y-2 text-xs md:text-sm">
              <li>
                <Link href="/vendor/register" className="text-muted-foreground hover:text-foreground transition-colors">
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link
                  href="/vendor/dashboard"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Vendor Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/vendor/guidelines"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Seller Guidelines
                </Link>
              </li>
              <li>
                <Link href="/vendor/support" className="text-muted-foreground hover:text-foreground transition-colors">
                  Vendor Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">Contact Us</h3>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                <span className="truncate">blessingsmuyeya@gmail.com</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                <span>+265 993 232 373</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3 w-3 md:h-4 md:w-4 shrink-0" />
                <span>Lilongwe, Malawi</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border text-center text-xs md:text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1 flex-wrap">
            <span>&copy; {new Date().getFullYear()} WaHeA. All rights reserved.</span>
            <span className="hidden sm:inline">Made with</span>
            <Heart className="inline h-3 w-3 md:h-4 md:w-4 text-primary fill-current" />
            <span className="hidden sm:inline">in Malawi</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
