"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Play, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Slide {
  section: "Getting Started" | "Seller" | "Buyer";
  title: string;
  points: string[];
  url: string;
}

const slides: Slide[] = [
  // Getting Started
  {
    section: "Getting Started",
    title: "Sign In with Cornell Email",
    points: [
      "Sign in with your @cornell.edu email — non-Cornell emails are not supported.",
      "After signing in, you'll be taken to your Orders page automatically.",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/signing_in.mov",
  },

  // Seller: Organizations
  {
    section: "Seller",
    title: "Organization Creation",
    points: [
      "Click Account in the top navigation and hover to reveal the dropdown, and select Organizations to view organizations you belong to.",
      "Click Create New Organization to set up your fundraising organization.",
      "Fill in every field — including a website or Instagram link to help verify your Cornell org.",
      "Newly created organizations will show a 'Need Approval' status, which CURaise admins will review + approve.",
      "To speed up approval, make sure your organization page includes a website or Instagram handle.",
      "NOTE: You must NOT add an @ symbol in front of your Instagram handle",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/creating_organization.mov",
  },
  {
    section: "Seller",
    title: "Adding Admins to Your Organization",
    points: [
      "After creating your organization, navigate to it and find the admin management section.",
      "Add admins who already have a CURaise account by searching their email.",
      "You can also invite admins who don't have accounts yet — they'll receive an email invitation to join.",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/admin_management.mov",
  },
  {
    section: "Seller",
    title: "Creating a New Fundraiser",
    points: [
      "From your organization page, click Create New Fundraiser.",
      "A Title is required — trying to save without one will show an error.",
      "Upload a cover image for your fundraiser.",
      "Set your start and end dates using the date picker.",
      "Go to the Pickup Events tab — you must add at least 1 pickup event before saving.",
      "Once pickup events are set, skip to the Review Fundraiser tab and click Save Fundraiser.",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/creating_fundraiser.mov",
  },
  {
    section: "Seller",
    title: "Editing Fundraiser Details",
    points: [
      "After saving, click the Edit button on your fundraiser.",
      "Fill out all fields under Basic Information, then click Save.",
      "Notice how the fundraiser card shows checkmarks for completed sections.",
      "Click Add Venmo Info to jump directly to the Venmo Information tab.",
      "NOTE: You MUST NOT add the @ symbol in front of your venmo username.",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/edit_fundraiser.mov",
  },
  {
    section: "Seller",
    title: "Adding Fundraiser Items",
    points: [
      "Go back and navigate to the Items tab.",
      "Add multiple items with names and prices (e.g., both at $0.50).",
      "Click Review to see a preview of how your fundraiser looks.",
      "Click Save Fundraiser to save the items.",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/adding-fundraising-items.mov",
  },
  {
    section: "Seller",
    title: "Setting Up Venmo Forwarding",
    points: [
      "In the Venmo Information tab, enter a valid email address.",
      "A confirmation email will be sent from postmaster@curaise.app.",
      "If you don't see it in your inbox, check your spam folder.",
      "Follow the instructions in the email to set up Venmo payment forwarding.",
      "This enables automatic Venmo payment confirmation for your orders.",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/verify_venmo.mov",
  },
  {
    section: "Seller",
    title: "Previewing and Publishing",
    points: [
      "Click Preview on your fundraiser page to see the buyer-facing view.",
      "Click the back button, then '<- CURaise' to return — unpublished fundraisers are saved and accessible later.",
      "Click Browse to confirm the unpublished fundraiser does NOT appear publicly.",
      "When you're ready, click Publish Fundraiser.",
      "Return to the home page — your fundraiser now shows as an Active Fundraiser.",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/publish_fundraiser.mov",
  },

  // Buyer
  {
    section: "Buyer",
    title: "Browsing and Adding Items",
    points: [
      "Click Browse and find the fundraiser you want to support.",
      "Note: Filters are not yet functional, but the search bar works.",
      "You can add a pickup event to your Google Calendar as a pre-filled event.",
      "Click on items to add them to your cart — try adding, removing, and re-adding items.",
      "Browsing to a different fundraiser shows a separate cart (each organization has its own cart).",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/browsing-fundraisers.mov",
  },
  {
    section: "Buyer",
    title: "Checkout and Placing an Order",
    points: [
      "Return to your fundraiser and click Proceed to Checkout.",
      "Payment Method can be Venmo or Other (covers Zelle and other methods).",
      "Adjust item quantities on the checkout page if needed.",
      "Click Place Order to submit — make sure to confirm before leaving the page.",
      "Go to Orders to see all your orders.",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/placing_order.mov",
  },
  {
    section: "Buyer",
    title: "Paying with Venmo",
    points: [
      "Click on your order to open the Order Details page.",
      "If your Venmo link isn't working, expand the 'Link not working?' dropdown for help.",
      "Click Pay with Venmo — the amount and recipient fields are pre-filled automatically.",
      "After paying, return to the Order Details page — the payment badge should automatically update to Confirmed.",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/venmo_payment.mov",
  },

  // Seller: Check-In
  {
    section: "Seller",
    title: "Scanning QR Codes at Pickup",
    points: [
      "When a buyer arrives to pick up their order, have them show their QR code.",
      "As an organizer, scan the QR code — it will take you directly to a confirmation page.",
      "Confirm that the buyer has received their item.",
      "Only organization admins can scan QR codes and see the confirmation page.",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/confirm_payment.mov",
  },
  {
    section: "Seller",
    title: "Manual Order Management",
    points: [
      "On the fundraiser orders page, you can manually mark items as picked up.",
      "You can also manually mark cash payments as received.",
      "Use the filters on the orders table to view by payment status or pickup status.",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/order_management.mov",
  },
  {
    section: "Seller",
    title: "Analytics and Filters",
    points: [
      "Navigate to the Analytics tab on your fundraiser page.",
      "Use filters to view revenue, item breakdowns, and order counts.",
      "Filter by date range, pickup event, or payment method to analyze your fundraiser's performance.",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/analytics_filter.mov",
  },

  // Buyer: Referrals
  {
    section: "Buyer",
    title: "Using Referral Links",
    points: [
      "Go to Browse and find a fundraiser that supports referrals.",
      "Add yourself as a referrer in the cart.",
      "Copy your referral link and share it — when someone opens it, your name is auto-filled as the referrer.",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/referral_request.mov",
  },

  // Seller: Referrals
  {
    section: "Seller",
    title: "Managing Referrals",
    points: [
      "Go to your fundraiser page — if there are pending referrals, the Manage Referrals button shows a badge.",
      "Click Manage Referrals and approve the referrals.",
      "Refresh the page and scroll down to see the referrals card update.",
      "At checkout, approved referrers will appear automatically and their quantities update in your seller view.",
    ],
    url: "https://zrqmplfsrshsdockyyjt.supabase.co/storage/v1/object/public/tutorial_videos/referral_management.mov",
  },
];

const SECTION_COLORS: Record<Slide["section"], string> = {
  "Getting Started": "bg-blue-100 text-blue-800",
  Seller: "bg-green-100 text-green-800",
  Buyer: "bg-purple-100 text-purple-800",
};

interface TutorialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: "buyer" | "seller";
}

export default function TutorialModal({
  open,
  onOpenChange,
  userRole,
}: TutorialModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleSlides = slides.filter(
    (s) =>
      s.section === "Getting Started" || s.section.toLowerCase() === userRole,
  );

  const slide = visibleSlides[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === visibleSlides.length - 1;

  const goNext = () => {
    if (!isLast) setCurrentIndex((i) => i + 1);
  };

  const goPrev = () => {
    if (!isFirst) setCurrentIndex((i) => i - 1);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) setCurrentIndex(0);
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-2xl w-full p-0 gap-0 overflow-hidden flex flex-col [&>button]:hidden"
        style={{ height: "92vh" }}
      >
        <DialogTitle className="sr-only">CURaise Tutorial</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold text-base">CURaise Tutorial</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {visibleSlides.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-muted">
          <div
            className="h-1 bg-primary transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / visibleSlides.length) * 100}%`,
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 p-6">
          {/* Section badge + title */}
          <div className="flex flex-col gap-2">
            <Badge
              className={cn(
                "w-fit text-xs font-medium",
                SECTION_COLORS[slide.section],
              )}
            >
              {slide.section}
            </Badge>
            <h2 className="text-lg font-bold">{slide.title}</h2>
          </div>

          {/* Video placeholder */}
          {slide.url === "" ? (
            <div className="w-full h-64 rounded-lg bg-muted flex flex-col items-center justify-center gap-2 border border-dashed border-muted-foreground/30">
              <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center shadow-sm border">
                <Play className="h-4 w-4 text-muted-foreground ml-0.5" />
              </div>
              <span className="text-sm text-muted-foreground">
                Video coming soon
              </span>{" "}
            </div>
          ) : (
            <div className="w-full rounded-lg overflow-hidden border bg-black">
              <video
                className="w-full max-h-[500px] object-contain"
                src={slide.url}
                controls
                controlsList="nodownload"
                playsInline
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Bullet points */}
          <ul className="space-y-2">
            {slide.points.map((point, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-2",
                  slide.title == "Organization Creation"
                    ? "text-xs"
                    : "text-sm",
                )}
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Slide dot navigation */}
        <div className="px-6 pb-2 flex items-center justify-center gap-1 flex-wrap">
          {visibleSlides.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              title={s.title}
              className={cn(
                "h-2 rounded-full transition-all duration-200",
                i === currentIndex
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
              )}
            />
          ))}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-background">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={isFirst}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {isLast ? (
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          ) : (
            <Button onClick={goNext} className="gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
