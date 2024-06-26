from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, FriendRequestSerializer, MessageSerializer, MatchSerializer, TicMatchSerializer
from .models import User as UserModel
from .models import FriendRequest, Message, Tournament, Match, TicMatch
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate, get_user_model, logout, login

UserModel = get_user_model()


@api_view(["POST"])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    print(request.data)

    if serializer.is_valid():
        # print("serialized")
        # Hash the password before saving
        # hashed_password = make_password(request.data["password"])
        # serializer.validated_data["password"] = hashed_password

        # Save the user
        serializer.save()

        return Response({"user": serializer.data})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if username is None or password is None:
            return Response({'error': 'Veuillez fournir à la fois le nom d\'utilisateur et le mot de passe'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)

        if not user:
            return Response({'error': 'Identifiants invalides'}, status=status.HTTP_401_UNAUTHORIZED)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key}, status=status.HTTP_200_OK)

class GetUsernameView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        username = request.user.username
        return Response({'username': username})

class GetProfilePicView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        user = UserModel.objects.get(id=user_id)
        print('logs from GetProfilePicView: ', user.profil_pic.url)

        profil_pic_url = user.profil_pic.url if user.profil_pic else None
        return Response({'profil_pic': profil_pic_url})

class GetEmailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        user = UserModel.objects.get(id=user_id)
        email = user.email
        return Response({'email': email})

class GetBioView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        user = UserModel.objects.get(id=user_id)
        bio = user.bio
        return Response({'bio': bio})

class GetUserIdView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.user.id
        return Response({'user_id': user_id})

class GetUsernameFromIdView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            user = UserModel.objects.get(id=user_id)
            username = user.username
            return Response({'username': username})
        except UserModel.DoesNotExist:
            return Response({'username': 'Unknown User'})

class GetEloView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        user = UserModel.objects.get(id=user_id)
        elo = user.elo
        return Response({'elo': elo})

class UpdateEloView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_elo = request.data.get('new_elo')
        if new_elo is None:
            return Response({'error': 'elo not here'}, status=400)
        user = request.user
        user.elo = new_elo
        user.save()

        return Response({'success': 'elo updated'})

class SendFriendRequestView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, to_user_id):
        to_user = get_object_or_404(UserModel, id=to_user_id)
        existing_request = FriendRequest.objects.filter(from_user=request.user, to_user=to_user).exists()
        existing_request2 = FriendRequest.objects.filter(from_user=to_user, to_user=request.user).exists()
        if existing_request or existing_request2:
            return Response({'status': 'error', 'message': 'Friend request already sent.'})
        friend_request = FriendRequest.objects.create(from_user=request.user, to_user=to_user)
        return Response({'status': 'success', 'friend_request_id': friend_request.id})

class FriendRequestsView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        received_requests = FriendRequest.objects.filter(to_user=request.user, status='pending')
        serializer = FriendRequestSerializer(received_requests, many=True)
        return Response(serializer.data)

class RespondFriendRequestView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, from_user_id):
        friend_request = FriendRequest.objects.filter(from_user_id=from_user_id, to_user=request.user).first()
        from_user = get_object_or_404(UserModel, id=from_user_id)
        if not friend_request:
            return Response({'status': 'none'})
        if friend_request.to_user != request.user:
            return Response({'status': 'error', 'message': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        action = request.data.get('action')

        if action == 'accept':
            request.user.friends.add(from_user)
            from_user.friends.add(request.user)
            friend_request.delete()
            return Response({'status': 'success', 'message': 'Friend request accepted.'})

        elif action == 'reject':
            friend_request.delete()
            return Response({'status': 'success', 'message': 'Friend request rejected.'})

        else:
            return Response({'status': 'error', 'message': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

class RemoveFriendView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, friend_id):
        current_user = request.user
        
        try:
            friend = UserModel.objects.get(id=friend_id)
        except UserModel.DoesNotExist:
            return Response({'error': 'Friend not found'}, status=status.HTTP_404_NOT_FOUND)
        
        current_user.friends.remove(friend)
        friend.friends.remove(current_user)
        
        return Response({'success': 'Friend removed successfully'}, status=status.HTTP_200_OK)

class GetFriendsView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        current_user = request.user
        friends = current_user.friends.all()
        serializer = UserSerializer(friends, many=True)
        return Response({'friends': serializer.data})

class BlockUserView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        b_user = get_object_or_404(UserModel, id=user_id)
        request.user.blocked.add(b_user)
        return Response({'status': 'success', 'message': 'User added to blocked list.'})

class RemoveBlockedUserView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, blocked_id):
        current_user = request.user
        
        try:
            block = UserModel.objects.get(id=blocked_id)
        except UserModel.DoesNotExist:
            return Response({'error': 'Blocked not found'}, status=status.HTTP_404_NOT_FOUND)
        
        current_user.blocked.remove(block)
        
        return Response({'success': 'Friend removed successfully'}, status=status.HTTP_200_OK)

class GetBlockedUserView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        current_user = request.user
        blocked = current_user.blocked.all()
        serializer = UserSerializer(blocked, many=True)
        return Response({'blocked': serializer.data})

class PlayerStatsView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        user = UserModel.objects.get(id=user_id)
        matches = Match.objects.filter(player=user)
        match_serializer = MatchSerializer(matches, many=True)
        return Response({
            'total_matches': user.total_matches(),
            'won_matches': user.count_won_matches(),
            'lost_matches': user.lost_matches(),
            'matches': match_serializer.data,
        })

class TicPlayerStatsView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        user = UserModel.objects.get(id=user_id)
        matches = TicMatch.objects.filter(player=user)
        match_serializer = TicMatchSerializer(matches, many=True)
        return Response({
            'total_matches': user.total_tic_matches(),
            'won_matches': user.won_tic_matches(),
            'lost_matches': user.lost_tic_matches(),
            'draw_matches': user.draw_tic_matches(),
            'matches': match_serializer.data,
        })

class PostMatchView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        player = get_object_or_404(UserModel, username=request.data.get('player_username'))
        opponent = get_object_or_404(UserModel, username=request.data.get('opponent_username'))
        player_score = request.data.get('player_score')
        opponent_score = request.data.get('opponent_score')
        winner = player if player_score > opponent_score else opponent
        played_at = request.data.get('played_at')

        match = Match.objects.create(
            player=player,
            opponent=opponent,
            player_score=player_score,
            opponent_score=opponent_score,
            winner=winner,
            played_at=played_at
        )

        return Response({'message': 'Match successfully stocked'}, status=status.HTTP_201_CREATED)

class PostTicMatchView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        player = get_object_or_404(UserModel, username=request.data.get('player_username'))
        opponent = get_object_or_404(UserModel, username=request.data.get('opponent_username'))
        match_status = request.data.get('match_status')  # 'win', 'loss', or 'draw'
        played_at = request.data.get('played_at')

        match = TicMatch.objects.create(
            player=player,
            opponent=opponent,
            match_status=match_status,
            played_at=played_at
        )

        return Response({'message': 'Match successfully stocked'}, status=status.HTTP_201_CREATED)

class GetMatchHistoryView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        match = Match.objects.filter(player=request.user)
        serializer = MatchSerializer(match, many=True)
        return Response({'match': serializer.data})

class GetMessageHistoryView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, other_user_id):
        try:
            current_user = request.user
            other_user = get_object_or_404(UserModel, id=other_user_id)
            messages_sent_by_current_user = Message.objects.filter(sender=current_user, receiver=other_user)
            messages_received_by_current_user = Message.objects.filter(sender=other_user, receiver=current_user)
            all_messages = messages_sent_by_current_user | messages_received_by_current_user
            sorted_messages = all_messages.order_by('timestamp')
            serializer = MessageSerializer(sorted_messages, many=True)

            return Response({'messages': serializer.data})
        except UserModel.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

class SendMessageView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, receiver_id):
        try:
            current_user = request.user
            receiver_user = get_object_or_404(UserModel, id=receiver_id)
            message_content = request.data.get('message', '')
            message = Message.objects.create(sender=current_user, receiver=receiver_user, content=message_content)
            serializer = MessageSerializer(message)
            return Response({'message': serializer.data}, status=201)
        except UserModel.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

class CreateTournamentView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            creator = request.user
            tournament = Tournament.objects.create(creator=creator)
            return Response({'message': 'Tournament created successfully', 'tournament_id': tournament.id})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class CheckTournamentView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            tournament = Tournament.objects.first()
            if tournament:
                creator_id = tournament.creator.username
                return Response({'tournament_exists': True, 'creator_id': creator_id})
            else:
                return Response({'tournament_exists': False})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class DeleteTournamentView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            Tournament.objects.all().delete()
            return Response({'message': 'Tournaments deleted successfully'}, status=200)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class VerifyTokenView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'message': 'Token is valid'})

class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({'message': 'Logged out successfully'})

class UpdateProfilePicView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        new_profil_pic = request.data.get('new_profil_pic')
        user.profil_pic = new_profil_pic
        user.save()
        return Response({'message': 'Profile picture updated successfully'})

class UpdateUsername(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        new_username = request.data.get('new_username')
        user.username = new_username
        user.save()
        return Response({'message': 'Username updated successfully'})

class UpdateEmailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        new_email = request.data.get('new_email')
        if UserModel.objects.filter(email=new_email).exists():
            return Response({'error': 'Email already in use'}, status=400)
        user.email = new_email
        user.save()
        return Response({'message': 'Email updated successfully'})

class ChangePassword(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        new_password = request.data.get('new_password')
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password updated successfully'})

class UpdateBioView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        new_bio = request.data.get('new_bio')
        user.bio = new_bio
        user.save()
        return Response({'message': 'Bio updated successfully'})

